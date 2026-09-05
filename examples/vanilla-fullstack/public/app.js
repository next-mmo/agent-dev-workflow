const message = document.querySelector("#message");

fetch("/api/hello")
  .then((response) => response.json())
  .then(({ message: text }) => {
    message.textContent = text;
  })
  .catch(() => {
    message.textContent = "The server is unavailable.";
  });
