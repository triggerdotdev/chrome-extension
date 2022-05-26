export async function createNewDocument(
  title: string,
  json: any,
  serverUrl: string = "https://jsonhero.io"
) {
  const options: RequestInit = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title,
      content: json,
    }),
  };

  const response = await fetch(
    `${serverUrl}/api/create.json?utm_source=chrome-extension`,
    options
  );
  const jsonResponse = await response.json();
  return jsonResponse;
}
