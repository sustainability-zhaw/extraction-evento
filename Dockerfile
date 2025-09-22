FROM python:3.11.1-slim-bullseye

RUN groupadd -r app && \
    useradd --no-log-init -r -m -g app app

COPY requirements.txt .
RUN pip install --root-user-action=ignore --no-cache-dir -r requirements.txt && \
    rm requirements.txt

COPY src/ /app/
RUN chmod -R 775 /app

USER app

WORKDIR /app

CMD [ "python", "main.py" ]
