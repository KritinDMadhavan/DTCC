import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

// GitHub OAuth callback component for model imports
export default function GitHubCallback() {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");
    console.log("GitHubCallback: code", code);
    if (code) {
      console.log("Setting github_auth_code in localStorage:", code);
      localStorage.setItem("github_auth_code", code);
      console.log("github_auth_code", localStorage.getItem("github_auth_code"));
      window.location.href = "/home"; // Force reload to ensure UploadModal sees the code
    }
  }, [searchParams]);

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="text-center">
        <h2 className="text-xl mb-4">Processing GitHub Authorization...</h2>
        <p className="text-gray-600 mb-4">
          Please wait while we complete the GitHub authorization.
        </p>
        <div className="mt-4 animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent mx-auto"></div>
      </div>
    </div>
  );
}