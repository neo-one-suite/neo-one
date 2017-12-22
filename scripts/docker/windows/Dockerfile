FROM microsoft/windowsservercore:ltsc2016

SHELL ["powershell", "-Command", "$ErrorActionPreference = 'Stop'; $ProgressPreference = 'SilentlyContinue';"]

RUN Set-ExecutionPolicy Bypass -Scope Process -Force; \
  iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'));
RUN choco install python --version 3.5.4 -y;
RUN $env:Path += ';C:\Python35;C:\Python35\Scripts';
RUN choco install vcredist2010 -y;
RUN choco install make -y;
RUN refreshenv;
RUN pip install pipenv;
RUN choco install nodejs --version 8.9.2 -y;
RUN $env:Path += ';C:\Program Files\nodejs';
