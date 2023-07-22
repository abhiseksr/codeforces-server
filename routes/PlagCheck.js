// C++ reserved keywords
const cppReservedKeywords = [
    "asm", "auto", "bool", "break", "case", "catch", "char", "class", "const", "continue",
    "default", "delete", "do", "double", "else", "enum", "explicit", "export", "extern",
    "false", "float", "for", "friend", "goto", "if", "inline", "int", "long", "mutable",
    "namespace", "new", "operator", "private", "protected", "public", "register", "reinterpret_cast",
    "return", "short", "signed", "sizeof", "static", "static_cast", "struct", "switch", "template",
    "this", "throw", "true", "try", "typedef", "typeid", "typename", "union", "unsigned", "using",
    "virtual", "void", "volatile", "wchar_t", "while"
  ];
  
  // Java reserved keywords
  const javaReservedKeywords = [
    "abstract", "assert", "boolean", "break", "byte", "case", "catch", "char", "class", "const",
    "continue", "default", "do", "double", "else", "enum", "extends", "final", "finally", "float",
    "for", "goto", "if", "implements", "import", "instanceof", "int", "interface", "long", "native",
    "new", "package", "private", "protected", "public", "return", "short", "static", "strictfp",
    "super", "switch", "synchronized", "this", "throw", "throws", "transient", "try", "void", "volatile",
    "while"
  ];
  
  // Python reserved keywords
  const pythonReservedKeywords = [
    "False", "None", "True", "and", "as", "assert", "async", "await", "break", "class", "continue",
    "def", "del", "elif", "else", "except", "finally", "for", "from", "global", "if", "import",
    "in", "is", "lambda", "nonlocal", "not", "or", "pass", "raise", "return", "try", "while", "with", "yield"
  ];
  
  // JavaScript reserved keywords
  const javascriptReservedKeywords = [
    "await", "break", "case", "catch", "class", "const", "continue", "debugger", "default", "delete",
    "do", "else", "export", "extends", "finally", "for", "function", "if", "import", "in",
    "instanceof", "new", "return", "super", "switch", "this", "throw", "try", "typeof", "var",
    "void", "while", "with", "yield"
  ];
  
  // Combined list of reserved keywords
  const allReservedKeywords = [
    ...cppReservedKeywords,
    ...javaReservedKeywords,
    ...pythonReservedKeywords,
    ...javascriptReservedKeywords
  ];

// Function to calculate the Longest Common Subsequence (LCS) length
function calculateLCSLength(tokens1, tokens2) {
    const m = tokens1.length;
    const n = tokens2.length;
    const dp = Array.from(Array(m + 1), () => Array(n + 1).fill(0));
  
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (tokens1[i - 1] === tokens2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }
  
    return dp[m][n];
  }

  function removeComments(code) {
    // JavaScript: Remove single-line and multiline comments
    code = code.replace(/\/\/.*|\/\*[^]*?\*\//g, '');
    
    // Python: Remove single-line comments
    code = code.replace(/#.*/g, '');
    
    // C++ and Java: Remove single-line and multiline comments
    code = code.replace(/\/\/.*|\/\*[^]*?\*\//g, '');
    
    return code;
  }
  
  // Function to calculate token similarity using LCS
  function calculateTokenSimilarity(tokens1, tokens2) {
    const lcsLength = calculateLCSLength(tokens1, tokens2);
    const similarity = lcsLength / Math.max(tokens1.length, tokens2.length);
    return similarity;
  }

  
// Function to replace variable names with a common word
function replaceVariableNames(tokens, placeholder) {
    return tokens.map(token => {
      // Check if the token is an identifier (variable name)
      if (token.match(/^[a-zA-Z_][a-zA-Z0-9_]*$/) && !allReservedKeywords.includes(token)) {
        // Replace the identifier with a placeholder
        return placeholder;
      }
      return token;
    });
  }
  
  // Main function for plagiarism check
  function performPlagiarismCheck(code1, code2) {
    // Tokenize the code
    // Split the code at whitespace and special characters
    code1 = removeComments(code1);
    code2 = removeComments(code2);
    let tokens1 = code1.split(/\s+|(;)|(\W+)/);
    let tokens2 = code2.split(/\s+|(;)|(\W+)/);

    // Remove empty tokens from the resulting array
    // console.log(tokens1, tokens2);
    tokens1 = tokens1.filter(token => token && token.trim() !== '');
    tokens2 = tokens2.filter(token => token && token.trim() !== '');
    
    // console.log(tokens1, tokens2);
    // Replace variable names with a common word (e.g., "var")
    const replacedTokens1 = replaceVariableNames(tokens1, 'var');
    const replacedTokens2 = replaceVariableNames(tokens2, 'var');
  
    // Calculate token similarity using LCS
    const similarity = calculateTokenSimilarity(replacedTokens1, replacedTokens2);
  
    // Set the similarity threshold (adjust as per your requirements)
    // const similarityThreshold = 0.8;
    // console.log(similarity);
  
    // Compare similarity with the threshold
    return similarity;
  }
  
  // Example usage
  const code1 = `
    function addNumbers(a, b) {
    // hello
      const sum = a + b;
      return sum;
    }
  `;
  
  const code2 = `
    function multiplyNumbers(x, y) {
        # bye
      const product = x * y;
      return product;
    }
  `;
  
// performPlagiarismCheck(code1, code2);


module.exports = performPlagiarismCheck;