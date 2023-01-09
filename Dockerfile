FROM python:3.11.1-slim-bullseye

ENV TARGET_HOST=
# ENV BATCH_INTERVAL=
# Evento cut off dates for the fall and spring term.
ENV CUTOFF_DATES=04-10,10-10
ENV LOG_LEVEL=debug

COPY requirements.txt /requirements.txt
COPY src/ /app/

RUN pip install -r requirements.txt && \
    rm requirements.txt && \
    groupadd -r app && \
    useradd --no-log-init -r -g app app && \
    chmod -R 775 /app

WORKDIR /app

USER app

CMD [ "python main.py" ]
