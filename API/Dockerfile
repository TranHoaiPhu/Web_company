# Sử dụng Python 3.11 slim image
FROM python:3.11-slim

# Thiết lập working directory
WORKDIR /app

# Copy requirements.txt trước để tận dụng Docker cache
COPY requirements.txt .

# Cài đặt dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy toàn bộ source code
COPY . .

# Expose port 8080 (Cloud Run default)
EXPOSE 8080

# Command để chạy ứng dụng
# Cloud Run sẽ inject biến PORT, mặc định là 8080
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}
