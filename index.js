const AWS = require("aws-sdk");
const util = require("util");
const sharp = require("sharp");

// get reference to S3 client
const s3 = new AWS.S3();

exports.handler = async (event) => {
  console.log("Reading event:\n", util.inspect(event, { depth: 5 }));
  const srcBucket = event.Records[0].s3.bucket.name;
  // Object key may have spaces or unicode non-ASCII characters.
  const srcKey = decodeURIComponent(
    event.Records[0].s3.object.key.replace(/\+/g, " ")
  );
  // Infer the image type from the file suffix.
  const typeMatch = srcKey.match(/\.([^.]*)$/);
  if (!typeMatch) {
    console.log("Could not determine the image type.");
    return;
  }
  // Check that the image type is supported
  const imageType = typeMatch[1].toLowerCase();
  if (imageType != "jpg" && imageType != "png") {
    console.log(`Unsupported image type: ${imageType}`);
    return;
  }

  try {
    const width = 80;
    const height = 60;
    // const width = process.env.WIDTH;
    // const height = process.env.HEIGHT;
    const prefix = `thumbnail-${width}x${height}`;
    const length = prefix.length;
    if (srcKey.substr(0, length) !== prefix) {
      const params = {
        Bucket: srcBucket,
        Key: srcKey,
      };
      const originImage = await s3.getObject(params).promise();
      /* START Thumbnails */
      const buffer = await sharp(originImage.Body).resize(width, height).toBuffer();
      const paramsThumbnails = {
        Bucket: srcBucket,
        Key: `${prefix}-${srcKey}`,
        Body: buffer,
        ContentType: "image",
      };
      await s3.putObject(paramsThumbnails).promise();
      /* END Thumbnails */
      console.log(`Successfully resized ${keyThumbnail}`);
    }
    return;
  } catch (error) {
    console.log('Error Resize Image: ', error);
    return;
  }
};
