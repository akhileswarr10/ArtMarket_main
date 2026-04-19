import sys
import os

# Append current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from models import Base
from sqlalchemy.schema import CreateTable
from sqlalchemy.dialects import postgresql

with open("/home/akhil/Paramu/Project_1/database_schema.sql", "w") as f:
    for table in Base.metadata.sorted_tables:
        f.write(str(CreateTable(table).compile(dialect=postgresql.dialect())))
        f.write(";\n\n")

print("Schema generated successfully.")
