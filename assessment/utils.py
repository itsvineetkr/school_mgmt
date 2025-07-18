import os
import json
import re
from typing import List, Dict, Union, Any, Optional
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure the Gemini API
genai.configure(api_key="")


class AssessmentGenerator:
    def __init__(self):
        # Initialize the Gemini model
        self.model = genai.GenerativeModel("gemini-2.0-flash")

    def generate_assessment(
        self,
        assessment_name: str,
        assessment_description: str,
        question_types: str,
        standard: str,
        num_questions: int = 5,
    ) -> List[Dict[str, Any]]:
        """
        Generate an assessment based on given parameters

        Args:
            assessment_name: Name of the assessment
            assessment_description: Description of what the assessment is about
            question_types: Types of questions (MCQ, Written, or Mix)
            standard: Class/Standard for which the assessment is intended
            num_questions: Number of questions to generate

        Returns:
            List of question dictionaries in the required format
        """
        # Create prompt for the AI
        prompt = self._create_prompt(
            assessment_name,
            assessment_description,
            question_types,
            standard,
            num_questions,
        )

        # Generate content using Gemini
        response = self.model.generate_content(prompt)

        # Extract and process JSON from the response
        try:
            assessment_data = self._extract_json(response.text)
            # Validate and clean the data
            validated_data = self._validate_assessment_data(
                assessment_data, question_types
            )
            return validated_data
        except Exception as e:
            print(f"Error during assessment generation: {e}")
            # Try one more time with a more structured prompt
            return self._fallback_generation(
                assessment_name,
                assessment_description,
                question_types,
                standard,
                num_questions,
            )

    def _create_prompt(
        self,
        assessment_name: str,
        assessment_description: str,
        question_types: str,
        standard: str,
        num_questions: int,
    ) -> str:
        """Create a detailed prompt for the AI model"""

        question_type_instructions = {
            "MCQ": "Generate only multiple-choice questions, each with 4 options.",
            "Written": "Generate only written questions that require detailed explanations as answers.",
            "Mix": "Generate a mix of multiple-choice and written questions. Approximately 60% MCQ and 40% written.",
        }

        # Directly fetch the instruction based on question type
        type_instruction = question_type_instructions[question_types]

        prompt = f"""
        You are an expert educator creating assessments for students in Indian schools.
        
        Please create a well-structured assessment with the following details:
        
        Assessment Name: {assessment_name}
        Assessment Description: {assessment_description}
        For: Class {standard} students in India
        Number of Questions: {num_questions}
        Question Types: {type_instruction}
        
        IMPORTANT INSTRUCTIONS:
        1. Generate questions that are age-appropriate and aligned with the Indian curriculum for Class {standard}.
        2. For each MCQ question:
           - Provide a clear, unambiguous question
           - Include 4 options labeled as options
           - Specify the correct answer as an integer (0-3) corresponding to the correct option's index
           - The question-type should be exactly "MCQ"
        
        3. For each written question:
           - Provide a clear question that prompts detailed explanations
           - Include an expected model answer
           - The question-type should be exactly "Written"
        
        4. Format your output as a valid JSON array containing question objects.
        
        Example MCQ question format:
        {{
            "question-type": "MCQ",
            "question": "What is the capital of India?",
            "options": ["Mumbai", "New Delhi", "Kolkata", "Chennai"],
            "answer": 1
        }}
        
        Example written question format:
        {{
            "question-type": "Written",
            "question": "Explain the importance of the Green Revolution in India.",
            "answer": "The Green Revolution in India refers to a period when agriculture in India was converted into an industrial system due to the adoption of modern methods and technology. It led to increased food production, particularly wheat and rice, and helped address food security concerns. The movement involved introducing high-yielding varieties of seeds, modern farming methods, irrigation facilities, pesticides, and fertilizers."
        }}
        
        Return ONLY the JSON array without any additional text or explanations.
        """
        return prompt

    def _extract_json(self, text: str) -> List[Dict[str, Any]]:
        """Extract JSON data from the model's response text"""
        # Find JSON content - looking for array of objects
        json_pattern = r"\[\s*\{.*\}\s*\]"
        json_match = re.search(json_pattern, text, re.DOTALL)

        if json_match:
            json_str = json_match.group(0)
            try:
                return json.loads(json_str)
            except json.JSONDecodeError:
                pass

        # Alternative approach: look for content between triple backticks
        code_block_pattern = r"```(?:json)?\s*([\s\S]*?)\s*```"
        code_blocks = re.findall(code_block_pattern, text)

        for block in code_blocks:
            try:
                return json.loads(block)
            except json.JSONDecodeError:
                continue

        # If all else fails, try to interpret the entire response as JSON
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            raise ValueError("Could not extract valid JSON from the response")

    def _validate_assessment_data(
        self, data: List[Dict[str, Any]], question_types: str
    ) -> List[Dict[str, Any]]:
        """Validate and clean the assessment data"""
        validated_data = []

        for item in data:
            # Ensure question type is correctly formatted
            if "question-type" not in item and "question_type" in item:
                item["question-type"] = item.pop("question_type")

            # Skip invalid question types based on requested types
            if question_types == "MCQ" and item.get("question-type") != "MCQ":
                continue
            if question_types == "Written" and item.get("question-type") != "Written":
                continue

            # Validate MCQ questions
            if item.get("question-type") == "MCQ":
                if (
                    "options" not in item
                    or not isinstance(item["options"], list)
                    or len(item["options"]) != 4
                ):
                    # Fix options if needed
                    if "options" not in item and "choices" in item:
                        item["options"] = item.pop("choices")
                    else:
                        continue  # Skip invalid MCQ question

                # Ensure answer is a valid integer
                if (
                    "answer" not in item
                    or not isinstance(item["answer"], int)
                    or item["answer"] < 0
                    or item["answer"] > 3
                ):
                    # Try to fix the answer format
                    if isinstance(item.get("answer"), str):
                        try:
                            item["answer"] = int(item["answer"])
                        except ValueError:
                            # If answer is a letter (A, B, C, D) or full text of the option
                            if item["answer"].upper() in ["A", "B", "C", "D"]:
                                item["answer"] = ord(item["answer"].upper()) - ord("A")
                            else:
                                # Try to match the answer text with an option
                                for i, option in enumerate(item["options"]):
                                    if (
                                        item["answer"].strip().lower()
                                        == option.strip().lower()
                                    ):
                                        item["answer"] = i
                                        break
                                else:
                                    continue  # Skip if we can't determine the answer

            # Validate Written questions
            if item.get("question-type") == "Written":
                if "question" not in item or "answer" not in item:
                    continue  # Skip invalid Written question

            validated_data.append(item)

        return validated_data

    def _fallback_generation(
        self,
        assessment_name: str,
        assessment_description: str,
        question_types: str,
        standard: str,
        num_questions: int,
    ) -> List[Dict[str, Any]]:
        """Fallback method if the normal generation fails"""
        # Create a more restrictive prompt
        question_type_mapping = {
            "MCQ": "MCQ questions",
            "Written": "Written questions",
            "Mix": "a mix of MCQ and Written questions",
        }

        type_instruction = question_type_mapping[question_types]

        prompt = f"""
        Generate a JSON array with {num_questions} assessment questions about "{assessment_name}" for Class {standard} in India.
        
        The assessment is about: {assessment_description}
        
        The JSON must follow this exact structure:
        [
            {{
                "question-type": "MCQ",
                "question": "Clear question text?",
                "options": ["Option A", "Option B", "Option C", "Option D"],
                "answer": 0
            }},
            {{
                "question-type": "Written",
                "question": "Written question text?",
                "answer": "Model answer text."
            }}
        ]
        
        The 'answer' field for MCQ questions must be an integer (0, 1, 2, or 3) representing the index of the correct option.
        
        Generate ONLY {type_instruction}.
        
        Return ONLY a valid JSON array, nothing else.
        """

        # Generate content using Gemini
        response = self.model.generate_content(prompt)

        try:
            # Try multiple JSON extraction methods
            try:
                # First, try direct JSON parsing
                assessment_data = json.loads(response.text)
            except json.JSONDecodeError:
                # If that fails, try the extraction method
                assessment_data = self._extract_json(response.text)

            # Validate and clean the data
            return self._validate_assessment_data(assessment_data, question_types)
        except Exception as e:
            print(f"Fallback generation also failed: {e}")
            # Return a minimal valid structure as last resort
            return self._create_emergency_assessment(
                assessment_name, assessment_description, question_types, num_questions
            )

    def _create_emergency_assessment(
        self,
        assessment_name: str,
        assessment_description: str,
        question_types: str,
        num_questions: int,
    ) -> List[Dict[str, Any]]:
        """Create a minimal valid assessment as last resort"""
        assessment = []

        # Create basic template questions
        if question_types in ["MCQ", "Mix"]:
            assessment.append(
                {
                    "question-type": "MCQ",
                    "question": f"Basic question about {assessment_name}?",
                    "options": ["Option A", "Option B", "Option C", "Option D"],
                    "answer": 0,
                }
            )

        if question_types in ["Written", "Mix"]:
            assessment.append(
                {
                    "question-type": "Written",
                    "question": f"Explain a key concept related to {assessment_name}.",
                    "answer": f"This would involve discussing important aspects of {assessment_description}.",
                }
            )

        # Duplicate questions if needed to reach minimum count
        while len(assessment) < min(num_questions, 3):
            assessment.append(assessment[0])

        return assessment


[
    {
        "question-type": "MCQ",
        "question": "If the discriminant of a quadratic equation is zero, the roots are:",
        "options": ["Real and distinct", "Imaginary", "Real and equal", "Irrational"],
        "answer": 2,
    },
    {
        "question-type": "MCQ",
        "question": "Which of the following is an example of an arithmetic progression (AP)?",
        "options": [
            "1, 4, 9, 16...",
            "2, 4, 8, 16...",
            "1, 3, 5, 7...",
            "1, 2, 4, 8...",
        ],
        "answer": 2,
    },
    {
        "question-type": "MCQ",
        "question": "The sum of the first 'n' natural numbers is given by:",
        "options": ["n(n+1)", "n(n-1)/2", "n(n+1)/2", "n^2"],
        "answer": 2,
    },
    {
        "question-type": "Written",
        "question": "Solve the following quadratic equation using the quadratic formula: 2x² + 5x - 3 = 0",
        "answer": "The quadratic formula is x = (-b ± √(b² - 4ac)) / 2a.  In this equation, a = 2, b = 5, and c = -3.  Substituting these values, we get x = (-5 ± √(5² - 4 * 2 * -3)) / (2 * 2) = (-5 ± √(25 + 24)) / 4 = (-5 ± √49) / 4 = (-5 ± 7) / 4.  Therefore, x = (-5 + 7) / 4 = 2/4 = 1/2 or x = (-5 - 7) / 4 = -12/4 = -3. The solutions are x = 1/2 and x = -3.",
    },
    {
        "question-type": "Written",
        "question": "The sum of the first n terms of an arithmetic progression is given by Sn = n/2[2a + (n-1)d], where a is the first term and d is the common difference. If the sum of the first 10 terms of an AP is 210 and the first term is 2, find the common difference.",
        "answer": "Given Sn = 210, n = 10, and a = 2.  We have 210 = 10/2[2(2) + (10-1)d] => 210 = 5[4 + 9d] => 42 = 4 + 9d => 38 = 9d => d = 38/9.",
    },
]


def evaluate_written_answers(written_answers: List[Dict]) -> List[Dict]:
    """Evaluate written answers using AI and return structured feedback"""

    model = genai.GenerativeModel("gemini-2.0-flash")

    eval_prompt = """
    You are an expert teacher evaluating student answers. For each answer:
    1. Compare it with the model answer
    2. Determine if it's substantially correct (capturing main points)
    3. Provide brief, constructive feedback

    Return ONLY a JSON array in this exact format:
    [
        {
            "question": "What is photosynthesis?",
            "correct": true,
            "remark": "Good explanation of the process. Covered key points about light energy and glucose production."
        }
    ]

    Here are the answers to evaluate:
    """ + json.dumps(
        written_answers, indent=2
    )

    try:
        response = model.generate_content(eval_prompt)
        # Try multiple JSON extraction methods
        try:
            evaluations = json.loads(response.text)
        except json.JSONDecodeError:
            # Look for JSON between code blocks
            json_match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", response.text)
            if json_match:
                evaluations = json.loads(json_match.group(1))
            else:
                raise ValueError("Could not extract valid JSON")

        # Validate structure
        for eval in evaluations:
            if not all(k in eval for k in ["question", "correct", "remark"]):
                raise ValueError("Invalid evaluation structure")

        return evaluations

    except Exception as e:
        print(f"Error evaluating answers: {e}")
        # Return basic feedback if AI evaluation fails
        return [
            {
                "question": ans["question"],
                "correct": False,
                "remark": "Could not evaluate answer due to technical error",
            }
            for ans in written_answers
        ]


def calculate_score(
    correct_answers: List[Dict],
    student_answers: List[Dict],
):
    score = 0
    max_score = len(correct_answers)

    written_answers = []

    for i in range(len(correct_answers)):
        if correct_answers[i]["question-type"] == "MCQ":
            answered = False if student_answers[i]["answer"] in ["", None] else True
            if answered and int(correct_answers[i]["answer"]) == int(
                student_answers[i]["answer"]
            ):
                score += 1
                print()

        elif correct_answers[i]["question-type"] == "Written":
            answered = False if student_answers[i]["answer"] in ["", None] else True
            if answered:
                written_answers.append(
                    {
                        "question": correct_answers[i]["question"],
                        "model_answer": correct_answers[i]["answer"],
                        "student_answer": student_answers[i]["answer"],
                    }
                )

    # Evaluate written answers using AI
    evaluations = evaluate_written_answers(written_answers)
    print(evaluations)
    remarks = []
    for i in range(len(evaluations)):
        if evaluations[i]["correct"]:
            score += 1
        remarks.append(evaluations[i]["remark"])
    return max_score, score, remarks
