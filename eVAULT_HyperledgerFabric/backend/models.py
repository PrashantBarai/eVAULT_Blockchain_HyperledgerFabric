from pydantic import BaseModel

class UserCreate(BaseModel):
    username: str
    email: str
    phone_number: str
    password: str
    user_type: str