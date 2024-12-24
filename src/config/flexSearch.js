
const FlexSearch = require('flexsearch');

const index = new FlexSearch.Document({
    document: {
        id: "id",
        index: ["name", "desc"]
    },
    tokenize: "forward", // Tokenizes text from left to right
    //encode: "advanced",  // Provides more advanced matching for typos
    threshold: 5,        // Tolerance for approximate matching
    resolution: 9,       // Improves relevance ranking

});

module.exports = index;

