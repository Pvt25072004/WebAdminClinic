const fs = require('fs');
const path = require('path');
const dir = 'd:/study/Senior/Project/All/web-admin/src/services';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.js') && f !== 'http.js');

const httpPath = path.join(dir, 'http.js');
let httpContent = fs.readFileSync(httpPath, 'utf8');

if (!httpContent.includes('export const handleResponse')) {
  httpContent += `
export const handleResponse = async (response, defaultErrorMessage) => {
  if (response.status === 401) {
    window.localStorage.removeItem("token");
    window.sessionStorage.removeItem("token");
    window.location.href = "/";
    throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
  }

  if (response.ok) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  let message = defaultErrorMessage;
  try {
    const errorBody = await response.json();
    if (errorBody?.message) {
      message =
        typeof errorBody.message === "string"
          ? errorBody.message
          : errorBody.message.join?.(", ");
    }
  } catch {}
  throw new Error(message);
};
`;
  fs.writeFileSync(httpPath, httpContent);
}

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Remove local handleResponse definition
  const handleResponseRegex = /const handleResponse = async \(response, defaultErrorMessage\) => \{[\s\S]*?\n\};\n*/g;
  content = content.replace(handleResponseRegex, '');
  
  // If api.js has a special handleResponse signature, just to be safe, replace the one that exists there too
  
  // Import handleResponse if not already imported
  if (!content.match(/import\s+\{[^}]*handleResponse[^}]*\}\s+from\s+['"].\/http['"]/)) {
    if (content.includes('import { getAuthHeaders } from "./http";')) {
       content = content.replace('import { getAuthHeaders } from "./http";', 'import { getAuthHeaders, handleResponse } from "./http";');
    } else {
       // if it doesn't have it, just add it at top
       content = 'import { handleResponse } from "./http";\n' + content;
    }
  }
  
  fs.writeFileSync(filePath, content);
}
console.log("Done refactoring handleResponse");
