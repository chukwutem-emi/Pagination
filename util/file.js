const fs = require("fs");
const path = require("path");

const deleteFile = (filePath) => {
    const fullPath = path.join(__dirname, "..", "image", filePath);
    fs.unlink(fullPath, (err) => {
        if (err) {
            throw (err);
        }
    })
}

exports.deleteFile = deleteFile;