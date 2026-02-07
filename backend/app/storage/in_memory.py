from typing import List, Optional
from datetime import datetime
from ..models.schemas import (
    Project, Configuration, RecordType, Department, UserRole, UploadedFile
)


class InMemoryStore:
    def __init__(self):
        self._projects = {}  # id -> Project dict

    def create_project(self, project: Project) -> Project:
        """Create a new project"""
        project_dict = project.model_dump()
        self._projects[project.id] = project_dict
        return project

    def get_project(self, project_id: str) -> Optional[Project]:
        """Get a project by ID"""
        if project_id not in self._projects:
            return None
        return Project(**self._projects[project_id])

    def list_projects(self) -> List[Project]:
        """List all projects"""
        return [Project(**p) for p in self._projects.values()]

    def update_project(self, project_id: str, **updates) -> Project:
        """Update project fields"""
        if project_id not in self._projects:
            raise ValueError(f"Project {project_id} not found")

        self._projects[project_id].update(updates)
        self._projects[project_id]["updated_at"] = datetime.utcnow()
        return Project(**self._projects[project_id])

    def delete_project(self, project_id: str) -> bool:
        """Delete a project"""
        if project_id in self._projects:
            del self._projects[project_id]
            return True
        return False

    def save_configuration(self, project_id: str, config: Configuration) -> None:
        """Save configuration for a project"""
        if project_id not in self._projects:
            raise ValueError(f"Project {project_id} not found")

        config_dict = config.model_dump()
        self._projects[project_id]["configuration"] = config_dict
        self._projects[project_id]["updated_at"] = datetime.utcnow()

    def update_record_type(self, project_id: str, rt_id: str, updates: dict) -> Optional[RecordType]:
        """Update a record type in a project's configuration"""
        if project_id not in self._projects:
            return None

        config = self._projects[project_id].get("configuration")
        if not config:
            return None

        for rt in config.get("record_types", []):
            if rt["id"] == rt_id:
                rt.update(updates)
                self._projects[project_id]["updated_at"] = datetime.utcnow()
                return RecordType(**rt)

        return None

    def update_department(self, project_id: str, dept_id: str, updates: dict) -> Optional[Department]:
        """Update a department in a project's configuration"""
        if project_id not in self._projects:
            return None

        config = self._projects[project_id].get("configuration")
        if not config:
            return None

        for dept in config.get("departments", []):
            if dept["id"] == dept_id:
                dept.update(updates)
                self._projects[project_id]["updated_at"] = datetime.utcnow()
                return Department(**dept)

        return None

    def update_role(self, project_id: str, role_id: str, updates: dict) -> Optional[UserRole]:
        """Update a user role in a project's configuration"""
        if project_id not in self._projects:
            return None

        config = self._projects[project_id].get("configuration")
        if not config:
            return None

        for role in config.get("user_roles", []):
            if role["id"] == role_id:
                role.update(updates)
                self._projects[project_id]["updated_at"] = datetime.utcnow()
                return UserRole(**role)

        return None

    def add_record_type(self, project_id: str, record_type: RecordType) -> Optional[RecordType]:
        """Add a new record type to a project's configuration"""
        if project_id not in self._projects:
            return None

        config = self._projects[project_id].get("configuration")
        if not config:
            return None

        rt_dict = record_type.model_dump()
        config["record_types"].append(rt_dict)
        self._projects[project_id]["updated_at"] = datetime.utcnow()
        return RecordType(**rt_dict)

    def delete_record_type(self, project_id: str, rt_id: str) -> bool:
        """Delete a record type from a project's configuration"""
        if project_id not in self._projects:
            return False

        config = self._projects[project_id].get("configuration")
        if not config:
            return False

        for i, rt in enumerate(config.get("record_types", [])):
            if rt["id"] == rt_id:
                config["record_types"].pop(i)
                self._projects[project_id]["updated_at"] = datetime.utcnow()
                return True

        return False

    def add_uploaded_file(self, project_id: str, file_info: UploadedFile) -> None:
        """Add uploaded file info to a project"""
        if project_id not in self._projects:
            raise ValueError(f"Project {project_id} not found")

        file_dict = file_info.model_dump()
        self._projects[project_id]["uploaded_files"].append(file_dict)
        self._projects[project_id]["updated_at"] = datetime.utcnow()


# Create singleton instance
store = InMemoryStore()
