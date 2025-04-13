def validate_standard(standard):
    try:
        standard = int(standard)
    except ValueError:
        return False
    return standard in range(1, 13)


def validate_section(section):
    return len(section) == 1 and section.isalpha()
