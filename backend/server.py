from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import asyncio
import resend
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Resend configuration
resend.api_key = os.environ.get('RESEND_API_KEY')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')
LANDLORD_EMAIL = os.environ.get('LANDLORD_EMAIL', 'agreements@flent.in')

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

class RenewalSubmission(BaseModel):
    tenant_email: EmailStr
    tenant_name: Optional[str] = None
    current_rent: float
    escalation_percent: float
    lockin_months: int
    lockin_label: str
    discount_percent: int
    new_monthly_rent: float
    total_savings: float

class RenewalSubmissionResponse(BaseModel):
    id: str
    status: str
    message: str


# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return status_checks


@api_router.post("/renewal/submit", response_model=RenewalSubmissionResponse)
async def submit_renewal(submission: RenewalSubmission):
    """Submit renewal choice and send emails to landlord and tenant"""
    
    submission_id = str(uuid.uuid4())
    timestamp = datetime.now(timezone.utc)
    
    # Store submission in database
    doc = submission.model_dump()
    doc['id'] = submission_id
    doc['timestamp'] = timestamp.isoformat()
    doc['status'] = 'submitted'
    
    await db.renewal_submissions.insert_one(doc)
    
    # Format currency for emails
    def format_currency(amount):
        return f"₹{amount:,.0f}"
    
    # Email to landlord (agreements@flent.in)
    landlord_html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
        <div style="background: #09090b; padding: 30px; border-radius: 12px;">
            <h1 style="color: #fff; margin-bottom: 20px;">New Renewal Submission</h1>
            
            <div style="background: #18181b; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h2 style="color: #a1a1aa; font-size: 14px; text-transform: uppercase; margin-bottom: 15px;">Tenant Details</h2>
                <p style="color: #fafafa; margin: 8px 0;"><strong>Email:</strong> {submission.tenant_email}</p>
                {f'<p style="color: #fafafa; margin: 8px 0;"><strong>Name:</strong> {submission.tenant_name}</p>' if submission.tenant_name else ''}
            </div>
            
            <div style="background: #18181b; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h2 style="color: #a1a1aa; font-size: 14px; text-transform: uppercase; margin-bottom: 15px;">Renewal Choice</h2>
                <p style="color: #fafafa; margin: 8px 0;"><strong>Current Rent:</strong> {format_currency(submission.current_rent)}</p>
                <p style="color: #fafafa; margin: 8px 0;"><strong>Escalation:</strong> {submission.escalation_percent}%</p>
                <p style="color: #fafafa; margin: 8px 0;"><strong>Lock-in Period:</strong> {submission.lockin_label}</p>
                <p style="color: #fafafa; margin: 8px 0;"><strong>Discount:</strong> {submission.discount_percent}% off escalation</p>
                <p style="color: #22c55e; margin: 8px 0; font-size: 18px;"><strong>New Monthly Rent:</strong> {format_currency(submission.new_monthly_rent)}</p>
            </div>
            
            <div style="background: #22c55e20; border: 1px solid #22c55e40; padding: 20px; border-radius: 8px;">
                <p style="color: #22c55e; margin: 0; font-size: 14px;">TOTAL SAVINGS (11 MONTHS)</p>
                <p style="color: #22c55e; margin: 5px 0 0 0; font-size: 28px; font-weight: bold;">{format_currency(submission.total_savings)}</p>
            </div>
            
            <p style="color: #71717a; font-size: 12px; margin-top: 20px;">Submitted on {timestamp.strftime('%B %d, %Y at %I:%M %p UTC')}</p>
            <p style="color: #71717a; font-size: 12px;">Submission ID: {submission_id}</p>
        </div>
    </body>
    </html>
    """
    
    # Email to tenant (confirmation)
    tenant_html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
        <div style="background: #09090b; padding: 30px; border-radius: 12px;">
            <h1 style="color: #fff; margin-bottom: 10px;">Renewal Confirmation</h1>
            <p style="color: #a1a1aa; margin-bottom: 30px;">Thank you for submitting your renewal choice!</p>
            
            <div style="background: #18181b; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h2 style="color: #a1a1aa; font-size: 14px; text-transform: uppercase; margin-bottom: 15px;">Your Selection</h2>
                <p style="color: #fafafa; margin: 8px 0;"><strong>Lock-in Period:</strong> {submission.lockin_label}</p>
                <p style="color: #fafafa; margin: 8px 0;"><strong>Discount:</strong> {submission.discount_percent}% off escalation</p>
            </div>
            
            <div style="background: #18181b; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h2 style="color: #a1a1aa; font-size: 14px; text-transform: uppercase; margin-bottom: 15px;">Pricing Summary</h2>
                <p style="color: #fafafa; margin: 8px 0;">Current Rent: {format_currency(submission.current_rent)}</p>
                <p style="color: #fafafa; margin: 8px 0;">Escalation ({submission.escalation_percent}%): +{format_currency(submission.current_rent * submission.escalation_percent / 100)}</p>
                {f'<p style="color: #22c55e; margin: 8px 0;">Discount on Escalation: -{format_currency(submission.current_rent * submission.escalation_percent / 100 * submission.discount_percent / 100)}</p>' if submission.discount_percent > 0 else ''}
                <hr style="border: none; border-top: 1px solid #27272a; margin: 15px 0;">
                <p style="color: #fff; margin: 8px 0; font-size: 20px;"><strong>New Monthly Rent: {format_currency(submission.new_monthly_rent)}</strong></p>
            </div>
            
            <div style="background: #22c55e20; border: 1px solid #22c55e40; padding: 20px; border-radius: 8px; text-align: center;">
                <p style="color: #22c55e; margin: 0; font-size: 14px;">YOUR TOTAL SAVINGS (11 MONTHS)</p>
                <p style="color: #22c55e; margin: 5px 0 0 0; font-size: 32px; font-weight: bold;">{format_currency(submission.total_savings)}</p>
            </div>
            
            <p style="color: #a1a1aa; margin-top: 25px; font-size: 14px;">
                Our team will review your submission and reach out to you shortly with the next steps.
            </p>
            
            <p style="color: #71717a; font-size: 12px; margin-top: 20px;">Reference ID: {submission_id}</p>
        </div>
    </body>
    </html>
    """
    
    try:
        # Send email to landlord
        landlord_params = {
            "from": SENDER_EMAIL,
            "to": [LANDLORD_EMAIL],
            "subject": f"New Renewal Submission - {submission.tenant_email}",
            "html": landlord_html
        }
        await asyncio.to_thread(resend.Emails.send, landlord_params)
        logger.info(f"Email sent to landlord: {LANDLORD_EMAIL}")
        
        # Skip tenant confirmation email (requires domain verification)
        # Once domain is verified, uncomment below:
        # tenant_params = {
        #     "from": "renewals@flent.in",
        #     "to": [submission.tenant_email],
        #     "subject": "Your Renewal Choice - Confirmation",
        #     "html": tenant_html
        # }
        # await asyncio.to_thread(resend.Emails.send, tenant_params)
        # logger.info(f"Confirmation email sent to tenant: {submission.tenant_email}")
        
        # Update status in database
        await db.renewal_submissions.update_one(
            {"id": submission_id},
            {"$set": {"status": "emails_sent"}}
        )
        
        return RenewalSubmissionResponse(
            id=submission_id,
            status="success",
            message="Your renewal choice has been submitted successfully. Our team will reach out to you shortly."
        )
        
    except Exception as e:
        logger.error(f"Failed to send emails: {str(e)}")
        
        # Update status in database
        await db.renewal_submissions.update_one(
            {"id": submission_id},
            {"$set": {"status": "email_failed", "error": str(e)}}
        )
        
        raise HTTPException(
            status_code=500,
            detail=f"Submission recorded but email delivery failed. Please contact support. Reference: {submission_id}"
        )


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
