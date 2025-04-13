def create_default_password(name: str, dob: str) -> str:
    """
    Generates a default password for new users.
    The password is set to 'password' by default.
    """
    name_part = name[0 : min(4, len(name))].upper()
    year_part = dob.split("-")[0]
    default_password = f"{name_part}{year_part}"

    # return default_password
    return "password"