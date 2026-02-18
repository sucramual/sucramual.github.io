const path = require("path");
const postcss = require("postcss");
const fs = require("fs/promises");

module.exports = function (eleventyConfig) {
    // Process CSS
    eleventyConfig.addTemplateFormats("css");

    eleventyConfig.addExtension("css", {
        outputFileExtension: "css",
        compile: async function (inputContent, inputPath) {
            if (path.basename(inputPath) !== "main.css") {
                return;
            }

            return async () => {
                const output = await postcss([
                    require("tailwindcss"),
                    require("autoprefixer"),
                    require("cssnano")
                ]).process(inputContent, {
                    from: inputPath,
                    to: path.join("_site/styles/main.css")
                });

                return output.css;
            };
        }
    });

    // Date filter
    eleventyConfig.addFilter("date", function (dateVal, format) {
        const d = new Date(dateVal);
        if (format === "MMM YYYY") {
            return d.toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
        }
        if (format === "MMMM YYYY") {
            return d.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
        }
        if (format === "DD MMM YYYY") {
            return d.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
        }
        return d.toISOString().slice(0, 10);
    });

    // Copy any other static files
    eleventyConfig.addPassthroughCopy("src/assets");

    return {
        dir: {
            input: "src",
            output: "_site",
            includes: "_includes"
        }
    };
};