import { ContentScriptResponse } from "./@types";

export function tryOpenGraph(): Array<ContentScriptResponse> | undefined {
  console.log(`[content-script] trying open graph`);

  const image = getOpenGraphMedia("image");
  const video = getOpenGraphMedia("video");
  const audio = getOpenGraphMedia("audio");
  const siteName = getMetaTagContent("og:site_name");
  const type = getMetaTagContent("og:type");
  const title = getMetaTagContent("og:title");
  const url = getMetaTagContent("og:url");
  const description = getMetaTagContent("og:description");
  const determiner = getMetaTagContent("og:determiner");
  const locale = getMetaTagContent("og:locale");
  const localeAlternate = getMetaTagContent("og:locale:alternate");

  const twitter = removeUndefined({
    card: getTwitterCardContent("card"),
    title: getTwitterCardContent("title"),
    description: getTwitterCardContent("description"),
    image: getTwitterCardContent("image:src"),
    site: getTwitterCardContent("site"),
  });

  const openGraphResult = removeUndefined({
    siteName,
    title,
    url,
    type,
    description,
    image: isEmpty(image) ? undefined : image,
    video: isEmpty(video) ? undefined : video,
    audio: isEmpty(audio) ? undefined : audio,
    twitter: isEmpty(twitter) ? undefined : twitter,
    determiner,
    locale,
    localeAlternate,
  });

  console.log(
    `[content-script] open graph result: ${JSON.stringify(openGraphResult)}`
  );

  if (isEmpty(openGraphResult)) {
    return;
  }

  return [
    {
      title: `${document.location.href} - Open Graph`,
      json: openGraphResult,
    },
  ];
}

function getOpenGraphMedia(name: "image" | "video" | "audio") {
  const url =
    getMetaTagContent(`og:${name}`) ?? getMetaTagContent(`og:${name}:url`);
  const secureUrl = getMetaTagContent(`og:${name}:secure_url`);
  const type = getMetaTagContent(`og:${name}:type`);
  const width = getMetaTagContent(`og:${name}:width`);
  const height = getMetaTagContent(`og:${name}:height`);
  const alt = getMetaTagContent(`og:${name}:alt`);

  return removeUndefined({
    url,
    secureUrl,
    type,
    width,
    height,
    alt,
  });
}

function getMetaTagContent(name: string): string | null | undefined {
  const metaTag = document.querySelector(`meta[property='${name}']`);

  return metaTag?.getAttribute("content");
}

function getTwitterCardContent(name: string): string | null | undefined {
  const metaTag = document.querySelector(`meta[name='twitter:${name}']`);

  return metaTag?.getAttribute("content");
}

function isEmpty(value?: { [key: string]: any }): boolean {
  return !value || Object.keys(value).length === 0;
}

function removeUndefined(value?: { [key: string]: any }): {
  [key: string]: any;
} {
  if (!value) {
    return {};
  }

  const result = {} as { [key: string]: any };

  for (const [k, v] of Object.entries(value)) {
    if (v !== undefined) {
      result[k] = v;
    }
  }

  return result;
}
