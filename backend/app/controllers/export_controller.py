from sqlalchemy.orm import Session
from fastapi import HTTPException
from fastapi.responses import StreamingResponse
from io import BytesIO, StringIO
import pandas as pd
from fpdf import FPDF
from app.models import (
    employee_db, attendance_log_db, leave_request_db, audit_log_db, 
    notification_db, export_log_db, user_db
)
from datetime import datetime

class PDF(FPDF):
    """
    Class representing PDF.
    """
    def header(self):
        """
        Adds the standard header to the PDF export document.
        """
        self.set_font('Arial', 'B', 12)
        self.cell(0, 10, 'Data Export Center - EEMS', 0, 1, 'C')

    def footer(self):
        """
        Adds the standard footer to the PDF export document.
        """
        self.set_y(-15)
        self.set_font('Arial', 'I', 8)
        self.cell(0, 10, f'Page {self.page_no()}', 0, 0, 'C')

def generate_pdf(df: pd.DataFrame, entity_name: str) -> BytesIO:
    """
    Generates a PDF document containing the exported dataframe content.
    """
    """
    Generate a simple PDF document from a pandas DataFrame.
    The PDF includes a header, the entity name, and a table representation of the data.
    """
    pdf = PDF()
    pdf.add_page()
    pdf.set_font("Arial", size=10)
    pdf.cell(0, 10, f"Entity: {entity_name}", 0, 1)
    
    # We will do a simple table. For very wide tables, this will get messy.
    # So we limit to 5-6 columns or just print them.
    columns = list(df.columns)
    
    col_width = pdf.w / (len(columns) + 1)
    row_height = pdf.font_size * 1.5

    # Header
    pdf.set_font("Arial", "B", 8)
    for col in columns:
        pdf.cell(col_width, row_height, str(col)[:15], border=1)
    pdf.ln(row_height)

    # Rows
    pdf.set_font("Arial", "", 8)
    for idx, row in df.iterrows():
        for col in columns:
            pdf.cell(col_width, row_height, str(row[col])[:15], border=1)
        pdf.ln(row_height)

    output = BytesIO()
    pdf.output(output)
    output.seek(0)
    return output

def fetch_data(db: Session, entity: str, company_id: int):
    """
    Retrieves the underlying data for the specified entity to be exported.
    """
    """
    Retrieve data for a specific entity type (e.g., employees, attendance) 
    and format it as a list of dictionaries suitable for DataFrame conversion.
    """
    if entity == "employees":
        records = db.query(employee_db.Employee).filter(employee_db.Employee.company_id == company_id).all()
        return [{"ID": r.id, "Name": r.name, "Email": r.email, "Role": r.role, "Join Date": r.joinDate, "Status": r.status} for r in records]
    
    elif entity == "attendance":
        records = db.query(attendance_log_db.AttendanceLog).filter(attendance_log_db.AttendanceLog.company_id == company_id).all()
        return [{"ID": r.id, "User ID": r.user_id, "Date": r.date, "Status": r.status, "Check In": r.check_in_time, "Check Out": r.check_out_time} for r in records]
    
    elif entity == "leave_requests":
        records = db.query(leave_request_db.LeaveRequest).filter(leave_request_db.LeaveRequest.company_id == company_id).all()
        return [{"ID": r.id, "User ID": r.user_id, "Type": r.leave_type, "Start Date": r.start_date, "End Date": r.end_date, "Status": r.status} for r in records]
    
    elif entity == "audit_logs":
        records = db.query(audit_log_db.AuditLog).filter(audit_log_db.AuditLog.company_id == company_id).all()
        return [{"ID": r.id, "Event": r.event_type, "Description": r.description, "Actor ID": r.actor_id, "Date": r.created_at} for r in records]
    
    elif entity == "notifications":
        records = db.query(notification_db.Notification).join(
            user_db.User, notification_db.Notification.user_email == user_db.User.email
        ).filter(user_db.User.company_id == company_id).all()
        return [{"ID": r.id, "User Email": r.user_email, "Message": r.message, "Type": r.type, "Is Read": r.is_read, "Date": r.created_at} for r in records]
    
    elif entity == "analytics":
        # Just export a summary
        emp_count = db.query(employee_db.Employee).filter(employee_db.Employee.company_id == company_id).count()
        return [{"Metric": "Total Employees", "Value": emp_count}]
    
    elif entity == "activity_tracking":
        records = db.query(user_db.User).filter(user_db.User.company_id == company_id).all()
        return [{"ID": r.id, "Name": r.name, "Email": r.email, "Last Login": r.last_login, "Last Logout": r.last_logout, "IP Address": r.last_ip_address, "Browser": r.last_browser, "New Device": r.is_new_device_login, "New IP": r.is_new_ip_login} for r in records]
    
    else:
        raise HTTPException(status_code=400, detail="Invalid entity")

def log_export(db: Session, company_id: int, user_id: int, entity: str, format: str):
    """
    Records an export action in the audit/export logs.
    """
    """
    Record an export event in the export logs table.
    """
    log = export_log_db.ExportLog(
        company_id=company_id,
        user_id=user_id,
        entity_type=entity,
        export_format=format
    )
    db.add(log)
    db.commit()

def generate_export(db: Session, entity: str, format: str, company_id: int, user_id: int):
    """
    Main function to trigger the generation of an export file (CSV/PDF).
    """
    """
    Generate an export file (CSV, Excel, or PDF) for the requested entity.
    Logs the export action and streams the file back as a response.
    """
    data = fetch_data(db, entity, company_id)
    if not data:
        data = [{"Message": "No data available"}]
    
    df = pd.DataFrame(data)
    
    filename = f"{entity}_export_{datetime.now().strftime('%Y%m%d%H%M%S')}"
    
    # Log export
    log_export(db, company_id, user_id, entity, format)
    
    if format == "csv":
        stream = StringIO()
        df.to_csv(stream, index=False)
        response = StreamingResponse(iter([stream.getvalue()]), media_type="text/csv")
        response.headers["Content-Disposition"] = f"attachment; filename={filename}.csv"
        return response
        
    elif format == "excel":
        output = BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name=entity)
        output.seek(0)
        response = StreamingResponse(output, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        response.headers["Content-Disposition"] = f"attachment; filename={filename}.xlsx"
        return response
        
    elif format == "pdf":
        output = generate_pdf(df, entity)
        response = StreamingResponse(output, media_type="application/pdf")
        response.headers["Content-Disposition"] = f"attachment; filename={filename}.pdf"
        return response
        
    else:
        raise HTTPException(status_code=400, detail="Invalid format")

def get_export_history(db: Session, company_id: int):
    """
    Retrieves the history of data exports performed within the company.
    """
    """
    Retrieve the history of data exports performed by users within the company.
    """
    logs = db.query(export_log_db.ExportLog).filter(export_log_db.ExportLog.company_id == company_id).order_by(export_log_db.ExportLog.created_at.desc()).all()
    # We want to attach user info
    result = []
    for log in logs:
        result.append({
            "id": log.id,
            "company_id": log.company_id,
            "user_id": log.user_id,
            "entity_type": log.entity_type,
            "export_format": log.export_format,
            "created_at": log.created_at,
            "user_name": log.user.name if log.user else "Unknown",
            "user_email": log.user.email if log.user else "Unknown"
        })
    return result
