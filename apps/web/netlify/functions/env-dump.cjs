exports.handler = async () => {
  const raw = process.env.TMDB_TOKEN || "";
  return {
    statusCode: 200,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      cwd: process.cwd(),
      hasToken: Boolean(raw.trim()),
      tokenPrefix: raw ? raw.slice(0, 12) : null,
      tokenLength: raw.length,
      nodeEnv: process.env.NODE_ENV || null,
    }),
  };
};
