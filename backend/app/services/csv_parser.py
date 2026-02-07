import csv
import io
from collections import Counter


class CSVParser:
    @staticmethod
    def parse(content: str) -> dict:
        """Parse CSV and extract metadata for AI analysis"""
        reader = csv.DictReader(io.StringIO(content))
        rows = list(reader)
        columns = reader.fieldnames or []

        # Analyze each column
        column_analysis = {}
        for col in columns:
            values = [r.get(col, "") for r in rows if r.get(col)]
            unique_count = len(set(values))
            sample_values = list(set(values))[:10]

            # Check if numeric
            is_numeric = True
            if values:
                for v in values[:20]:
                    if v and not v.replace('.', '', 1).replace('-', '', 1).replace(',', '').isdigit():
                        is_numeric = False
                        break

            # Check if date
            is_date = any(kw in col.lower() for kw in ["date", "time", "created", "submitted", "approved"])

            column_analysis[col] = {
                "unique_count": unique_count,
                "total_count": len(values),
                "sample_values": sample_values,
                "appears_numeric": is_numeric,
                "appears_date": is_date,
            }

        # Get sample rows (first 15)
        sample_rows = rows[:15]

        return {
            "columns": columns,
            "total_rows": len(rows),
            "sample_rows": sample_rows,
            "column_analysis": column_analysis,
        }

    @staticmethod
    def to_summary_string(metadata: dict) -> str:
        """Convert metadata to a string suitable for Claude prompt"""
        lines = []
        lines.append(f"Total rows: {metadata['total_rows']}")
        lines.append(f"Columns ({len(metadata['columns'])}): {', '.join(metadata['columns'])}")
        lines.append("")
        lines.append("Column Analysis:")
        for col, info in metadata['column_analysis'].items():
            sample = info['sample_values'][:5]
            lines.append(f"  {col}: {info['unique_count']} unique values, samples: {sample}")
        lines.append("")
        lines.append("Sample Rows (first 5):")
        for i, row in enumerate(metadata['sample_rows'][:5]):
            lines.append(f"  Row {i+1}: {dict(row)}")
        return "\n".join(lines)
