import os
import requests
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# ==========================================
# 1. KONFIGURASI CORS
# ==========================================
# Menambahkan port 5173 (Vite default) dan 3000 (Next.js default)
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173", 
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# 2. KONFIGURASI URL N8N (LOCALHOST)
# ==========================================
# MODIFIKASI: Menggunakan 'localhost' sesuai permintaan
# Pastikan workflow n8n Anda aktif di URL ini
N8N_WEBHOOK_URL = os.getenv("N8N_WEBHOOK_URL", "http://host.docker.internal:5678/webhook/chat")
N8N_UPLOAD_URL = os.getenv("N8N_UPLOAD_URL", "http://host.docker.internal:5678/webhook/upload")

# Model data untuk chat (Termasuk Session ID)
class ChatRequest(BaseModel):
    message: str
    sessionId: str = "default-session" 

@app.get("/")
def read_root():
    return {"status": "Backend is running and ready!"}

# ==========================================
# 3. ENDPOINT CHAT
# ==========================================
@app.post("/api/chat")
def chat_endpoint(request: ChatRequest):
    print(f"📩 Chat Masuk: {request.message} | Session: {request.sessionId}")
    
    try:
        # Siapkan payload ke n8n
        payload = {
            "chatInput": request.message,
            "sessionId": request.sessionId
        }
        
        print(f"🚀 Mengirim ke n8n: {N8N_WEBHOOK_URL}")
        
        # Kirim request ke n8n
        response = requests.post(N8N_WEBHOOK_URL, json=payload, timeout=600)
        
        # Log untuk debugging
        print(f"✅ Status n8n: {response.status_code}")
        print(f"📦 Respon n8n: {response.text}")

        if response.status_code == 200:
            data = response.json()
            # Ambil jawaban dari key 'output'
            ai_reply = data.get("output", "Maaf, n8n tidak memberikan jawaban yang valid (Cek node Respond to Webhook).")
            return {"reply": ai_reply}
        else:
            raise HTTPException(status_code=500, detail=f"Error n8n: {response.text}")
            
    except Exception as e:
        print(f"❌ Error System: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ==========================================
# 4. ENDPOINT UPLOAD PDF
# ==========================================
@app.post("/api/upload")
async def upload_document(
    file: UploadFile = File(...), 
    sessionId: str = Form("default-session") # Terima session ID dari FormData
):
    print(f"📂 Upload File: {file.filename} | Session: {sessionId}")
    
    try:
        file_content = await file.read()
        
        # Kirim sebagai Multipart ke n8n
        files_payload = {
            'data': (file.filename, file_content, file.content_type)
        }
        
        # Data tambahan
        data_payload = {
            'sessionId': sessionId
        }
        
        print(f"🚀 Mengupload ke n8n: {N8N_UPLOAD_URL}")
        
        response = requests.post(N8N_UPLOAD_URL, files=files_payload, data=data_payload, timeout=60)
        
        if response.status_code == 200:
            return {"status": "success", "filename": file.filename}
        else:
            print(f"❌ Error Upload n8n: {response.text}")
            raise HTTPException(status_code=500, detail="Gagal memproses upload di n8n")
            
    except Exception as e:
        print(f"❌ Error Upload System: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))