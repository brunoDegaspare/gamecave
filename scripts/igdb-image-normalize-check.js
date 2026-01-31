const normalizeUrl = (url) => {
  if (!url) return null;
  return url.startsWith("//") ? `https:${url}` : url;
};

const normalizeIgdbImageUrl = (url, size) => {
  const normalized = normalizeUrl(url);
  if (!normalized) return null;
  if (normalized.includes("/t_")) {
    return normalized.replace(/\/t_[^/]+\//, `/${size}/`);
  }
  return normalized;
};

const cases = [
  {
    input: "https://images.igdb.com/igdb/image/upload/t_thumb/abc123.jpg",
    expected:
      "https://images.igdb.com/igdb/image/upload/t_screenshot_big/abc123.jpg",
  },
  {
    input:
      "https://images.igdb.com/igdb/image/upload/t_screenshot_big/xyz789.jpg",
    expected:
      "https://images.igdb.com/igdb/image/upload/t_screenshot_big/xyz789.jpg",
  },
];

let failed = false;
for (const { input, expected } of cases) {
  const output = normalizeIgdbImageUrl(input, "t_screenshot_big");
  if (output !== expected) {
    failed = true;
    console.error("FAIL", { input, expected, output });
  } else {
    console.log("OK", output);
  }
}

if (failed) {
  process.exit(1);
}
