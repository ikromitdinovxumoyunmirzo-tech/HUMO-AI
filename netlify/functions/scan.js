exports.handler = async function (event) {
  var H = { "Content-Type": "application/json" };
  function out(code, o) { return { statusCode: code, headers: H, body: JSON.stringify(o) }; }
  if (event.httpMethod !== "POST") return out(405, { error: "POST only" });
  var key = process.env.OPENROUTER_API_KEY;
  if (!key) return out(500, { error: "OPENROUTER_API_KEY sozlanmagan" });
  var model = process.env.OPENROUTER_MODEL || "openrouter/free";
  var b;
  try { b = JSON.parse(event.body || "{}"); } catch (e) { return out(400, { error: "bad json" }); }
  if (!b.image || typeof b.image !== "string" || b.image.length > 1500000 || typeof b.prompt !== "string" || b.prompt.length > 2000)
    return out(400, { error: "bad input" });
  try {
    var r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": "Bearer " + key, "Content-Type": "application/json", "X-Title": "HUMO AI" },
      body: JSON.stringify({
        model: model,
        max_tokens: 700,
        messages: [{ role: "user", content: [
          { type: "text", text: b.prompt },
          { type: "image_url", image_url: { url: "data:image/jpeg;base64," + b.image } }
        ] }]
      })
    });
    var j = await r.json();
    if (!r.ok) return out(502, { error: (j.error && j.error.message) || "API xatosi" });
    var text = j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content;
    if (!text) return out(502, { error: "Bo'sh javob, qayta urinib ko'ring" });
    return out(200, { text: text });
  } catch (e) {
    return out(500, { error: "server xatosi" });
  }
};
