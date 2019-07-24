FROM quay.io/neoone/node:1.5
RUN mkdir -p etc/static-html
COPY static/ etc/static-html/
CMD ["--environment.rpc.splashScreen.path=/etc/static-html/", "--environment.rpc.http.host=0.0.0.0"]
