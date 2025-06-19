import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const OR_API_KEY = process.env.OPENROUTER_API_KEY?.trim();
const OR_MODEL_URL = "https://openrouter.ai/api/v1/chat/completions";

//function for improving website
export async function analyzeWebsite(metaTags, scripts, useCase, seoFocused, performanceFocused) {
    try {
        console.log("🚀 Starting website analysis...");
        console.log("Received Website Meta Tags:", metaTags);
        console.log("Received Scripts:", scripts);
        console.log("User Preferences - Use Case:", useCase);
        console.log("User Preferences - SEO Focused:", seoFocused);
        console.log("User Preferences - Performance Focused:", performanceFocused);

        if (!OR_API_KEY) throw new Error("❌ Missing OpenRouter API Key");
const prompt = `
# System Role
You are a highly experienced web solutions architect and AI assistant specializing in **web application architecture, frontend/backend frameworks**, **SEO best practices**, **performance optimization**, **cloud infrastructure**, and **devops tools**. Your primary task is to help analyze a website's existing metadata, frontend stack, and user preferences to provide **tailored recommendations** for the most suitable **technology stack** and **infrastructure solutions**.

Your analysis must take into account:
- **SEO optimization**
- **Performance optimization**
- **Use case** of the website
- **Current frontend technologies/scripts**
- **Required backend technologies and hosting platforms**

# Task
You will be provided with:
- **Intended Use Case with detail** (e.g., Portfolio with its detail, Blog with its detail, E-commerce with its detail, SaaS with its detail, etc.)
- **SEO-Focused Requirement** (Boolean - whether SEO is a priority)
- **Performance-Focused Requirement** (Boolean - whether performance is a priority)

Your goal is to generate a **valid JSON object** containing the issues of the website and the solution for them in the form of following recommendations:
1. **Frontend Technologies**:
   - Existing technologies used in the website (if any).
   - problematic technologies used in the website (if any).
   - recommend the **frameworks**, **languages**, and **rendering strategies** best suited for the project.
   -indicate a percentage of how much recommended stack will improve the system/problem.
   - Consider the balance between ease of use, scalability, and performance.
   - If SEO is important, recommend SSR (server-side rendering) or hybrid frameworks.
   - If performance is key, suggest static site generation (SSG), edge functions, or CDN-backed hosting.
   
2. **Backend Technologies**:
   - Existing technologies used in the website (if any).
   - problematic technologies used in the website (if any).
    -indicate a percentage of how much recommended stack will improve the system/problem.
   - Recommend appropriate **backend languages**, **frameworks**, and **runtime environments**.
   - Ensure that you suggest **scalable** and **secure** technologies for complex applications.
   - If the use case involves microservices or serverless, suggest frameworks that align with this architecture.
   
3. **Database Technology**:
   - Existing technologies used in the website (if any).
   - problematic technologies used in the website (if any).
    -indicate a percentage of how much recommended stack will improve the system/problem.
   - Choose either **SQL** or **NoSQL** databases based on the website's data structure and needs.
   - Justify the choice of database (e.g., relational databases like PostgreSQL for structured data or MongoDB for flexible document-based data).
   - Do not mention database tech in the backend section; it should only appear in the **database** section.

4. **Hosting Platforms**:
   - Existing technologies used in the website (if any).
   - problematic technologies used in the website (if any).
    -indicate a percentage of how much recommended stack will improve the system/problem.
   - Provide cloud-native hosting solutions (e.g., AWS, Azure, DigitalOcean) or specialized platforms for static sites (e.g., Vercel, Netlify).
   - Consider factors like **scalability**, **global distribution via CDN**, and **serverless architecture** where appropriate.
   - If SSR is recommended, suggest hosting that supports it, such as Vercel or Netlify.
   
5. **Additional Dev Tools or Practices**:
   - Suggest tools for **continuous integration (CI)** and **continuous deployment (CD)**, such as GitHub Actions, GitLab CI, CircleCI, etc.
   - Recommend version control systems (VCS) and relevant best practices for managing development workflows.
    -indicate a percentage of how much recommended stack will improve the system/problem.
   - Advise on **monitoring tools** (e.g., Prometheus, Grafana, New Relic, Sentry) and **logging solutions** for application performance and error tracking.

6. **Reasoning**:
   - Provide a **detailed explanation** for each recommendation, linking it to the website’s specific use case, SEO/performance needs, and frontend/backend stack.
   - Avoid generic responses, and offer **specific technologies** based on real-world best practices.
   - Clearly explain the **trade-offs** between different technologies, frameworks, or approaches, especially when there are multiple valid options.

# Requirements
- Match recommendations to the user's preferences (SEO/performance).
- Keep recommendations practical and avoid suggesting complex stacks for simple projects.
- For SEO-focused sites, prefer SSR, SSG, or hybrid rendering strategies that enhance SEO.
- For performance-focused sites, recommend static site generation (SSG), edge functions, and CDN usage.
- Choose a **single database** technology based on the use case and avoid redundant recommendations in the backend section.
- Ensure the output is **valid JSON**, properly formatted with no extra text or explanation outside the JSON structure.
- Only provide multiple options when they are equally valid and relevant to the project’s needs.

# Output Format
Return **only valid JSON** in this structure:

{
  "frontend": {
    "the problem they may cause based on the use case might be": ["problem 1", "problem 2", ...],
    "stack": ["technology1", "technology2", ...],
    "reason": "Explain why these technologies are suitable for the project."
    "estimated_improvement": "...%" 
  },
  "backend": {
   "stack": ["technology1", "technology2", ...],
   "reason": "Explain why these technologies are suitable for the project."
   "estimated_improvement": "...%" 
  },
  "database": {
    "stack": ["technology1"],
    "reason": "Explain why these technologies are suitable for the project."
    "estimated_improvement": "...%" 
  },
  "hosting": {
    "stack": ["technology1", "technology2", ...],
    "reason": "Explain why these technologies are suitable for the project."
    "estimated_improvement": "...%" 
  },
  "other": {
  "stack": ["technology1", "technology2", ...],
  "reason": "Explain why these technologies are suitable for the project."
  "estimated_improvement": "...%" 
}

# Input for Analysis
### User Preferences:
- Intended Use Case: ${useCase}
- SEO Focused: ${seoFocused ? "Yes" : "No"}
- Performance Focused: ${performanceFocused ? "Yes" : "No"}
`;




        const response = await axios.post(
            OR_MODEL_URL,
            {
                model: "mistralai/mistral-7b-instruct",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.7,
                max_tokens: 1000
            },
            {
                headers: {
                    Authorization: `Bearer ${OR_API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        const rawText = response.data.choices[0].message.content;
        console.log("✅ Raw AI Response:", rawText);

        const jsonMatch = rawText.match(/{[\s\S]*}/);
        if (!jsonMatch) throw new Error("❌ No valid JSON block found in AI response.");

        let parsedResponse;
        try {
            parsedResponse = JSON.parse(jsonMatch[0]);
            detectRedundantDatabases(parsedResponse); // ✅ Check for overlap
          //   console.log("✅ Parsed AI Response:", parsedResponse);
            return parsedResponse;
        } catch (error) {
            console.error("❌ Failed to parse JSON. Raw extracted block:\n", jsonMatch[0]);
            throw new Error("❌ Invalid JSON format in AI response. Possible trailing commas or explanation text mixed in.");
        }

    } catch (error) {
        console.error("❌ OpenRouter API Error:", error?.response?.data || error.message);
        return { error: "Failed to analyze website using OpenRouter" };
    }
}



//function for recommeding stack
export async function recommendingTechStack(useCase, seoFocused, performanceFocused) {
    try {
        console.log("🚀 recommending techstack based on user preferences...");
        console.log("User Preferences - Use Case:", useCase);
        console.log("User Preferences - SEO Focused:", seoFocused);
        console.log("User Preferences - Performance Focused:", performanceFocused);

        if (!OR_API_KEY) throw new Error("❌ Missing OpenRouter API Key");
const prompt = `
# System Role
You are a highly experienced web solutions architect and AI assistant specializing in **web application architecture, frontend/backend frameworks**, **SEO best practices**, **performance optimization**, **cloud infrastructure**, and **devops tools**. Your primary task is to help analyze a website's existing metadata, frontend stack, and user preferences to provide **tailored recommendations** for the most suitable **technology stack** and **infrastructure solutions**.

Your analysis must take into account:
- **SEO optimization**
- **Performance optimization**
- **Use case** of the website
- **Current frontend technologies/scripts**
- **Required backend technologies and hosting platforms**

# Task
You will be provided with:
- **Website Meta Tags** (meta title + meta description)
- **Detected Frontend Technologies** (e.g., JavaScript libraries/frameworks)
- **Intended Use Case** (e.g., Portfolio, Blog, E-commerce, SaaS, etc.)
- **SEO-Focused Requirement** (Boolean - whether SEO is a priority)
- **Performance-Focused Requirement** (Boolean - whether performance is a priority)

Your goal is to generate a **valid JSON object** containing the following recommendations:
1. **Frontend Technologies**:
   - List the **frameworks**, **languages**, and **rendering strategies** best suited for the project.
   - Consider the balance between ease of use, scalability, and performance.
   - If SEO is important, recommend SSR (server-side rendering) or hybrid frameworks.
   - If performance is key, suggest static site generation (SSG), edge functions, or CDN-backed hosting.
   
2. **Backend Technologies**:
   - Recommend appropriate **backend languages**, **frameworks**, and **runtime environments**.
   - Ensure that you suggest **scalable** and **secure** technologies for complex applications.
   - If the use case involves microservices or serverless, suggest frameworks that align with this architecture.
   
3. **Database Technology**:
   - Choose either **SQL** or **NoSQL** databases based on the website's data structure and needs.
   - Justify the choice of database (e.g., relational databases like PostgreSQL for structured data or MongoDB for flexible document-based data).
   - Do not mention database tech in the backend section; it should only appear in the **database** section.

4. **Hosting Platforms**:
   - Provide cloud-native hosting solutions (e.g., AWS, Azure, DigitalOcean) or specialized platforms for static sites (e.g., Vercel, Netlify).
   - Consider factors like **scalability**, **global distribution via CDN**, and **serverless architecture** where appropriate.
   - If SSR is recommended, suggest hosting that supports it, such as Vercel or Netlify.
   
5. **Additional Dev Tools or Practices**:
   - Suggest tools for **continuous integration (CI)** and **continuous deployment (CD)**, such as GitHub Actions, GitLab CI, CircleCI, etc.
   - Recommend version control systems (VCS) and relevant best practices for managing development workflows.
   - Advise on **monitoring tools** (e.g., Prometheus, Grafana, New Relic, Sentry) and **logging solutions** for application performance and error tracking.

6. **Reasoning**:
   - Provide a **detailed explanation** for each recommendation, linking it to the website’s specific use case, SEO/performance needs, and frontend/backend stack.
   - Avoid generic responses, and offer **specific technologies** based on real-world best practices.
   - Clearly explain the **trade-offs** between different technologies, frameworks, or approaches, especially when there are multiple valid options.

# Requirements
- Match recommendations to the user's preferences (SEO/performance).
- If certain scripts are already present (e.g., React, Vue.js, etc.), suggest compatible libraries or frameworks.
- Keep recommendations practical and avoid suggesting complex stacks for simple projects.
- For SEO-focused sites, prefer SSR, SSG, or hybrid rendering strategies that enhance SEO.
- For performance-focused sites, recommend static site generation (SSG), edge functions, and CDN usage.
- Choose a **single database** technology based on the use case and avoid redundant recommendations in the backend section.
- Ensure the output is **valid JSON**, properly formatted with no extra text or explanation outside the JSON structure.
- Only provide multiple options when they are equally valid and relevant to the project’s needs.

# Output Format
Return **only valid JSON** in this structure:

{
  "frontend": {
    "stack": ["technology1", "technology2", ...],
    "reason": "Explain why these technologies are suitable for the project."
  },
  "backend": {
   "stack": ["technology1", "technology2", ...],
    "reason": "Explain why these technologies are suitable for the project."
  },
  "database": {
    "stack": ["technology1", "technology2", ...],
    "reason": "Explain why these technologies are suitable for the project."
  },
  "hosting": {
   "stack": ["technology1", "technology2", ...],
   "reason": "Explain why these technologies are suitable for the project."
  },
  "other": {
  "stack": ["technology1", "technology2", ...],
  "reason": "Explain why these technologies are suitable for the project."
  }
}

# Input for Analysis

### User Preferences:
- Intended Use Case: ${useCase}
- SEO Focused: ${seoFocused ? "Yes" : "No"}
- Performance Focused: ${performanceFocused ? "Yes" : "No"}
`;




        const response = await axios.post(
            OR_MODEL_URL,
            {
                model: "mistralai/mistral-7b-instruct",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.7,
                max_tokens: 1000
            },
            {
                headers: {
                    Authorization: `Bearer ${OR_API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        const rawText = response.data.choices[0].message.content;
        console.log("✅ Raw AI Response:", rawText);

        const jsonMatch = rawText.match(/{[\s\S]*}/);
        if (!jsonMatch) throw new Error("❌ No valid JSON block found in AI response.");

        let parsedResponse;
        try {
            parsedResponse = JSON.parse(jsonMatch[0]);
            detectRedundantDatabases(parsedResponse); // ✅ Check for overlap
          //   console.log("✅ Parsed AI Response:", parsedResponse);
            return parsedResponse;
        } catch (error) {
            console.error("❌ Failed to parse JSON. Raw extracted block:\n", jsonMatch[0]);
            throw new Error("❌ Invalid JSON format in AI response. Possible trailing commas or explanation text mixed in.");
        }

    } catch (error) {
        console.error("❌ OpenRouter API Error:", error?.response?.data || error.message);
        return { error: "Failed to analyze website using OpenRouter" };
    }
}

// ✅ Helper: Check for DB tech appearing in both backend and database sections
function detectRedundantDatabases(parsedResponse) {
    const dbNames = parsedResponse.database?.stack?.map(db => db.toLowerCase()) || [];
    const backendNames = parsedResponse.backend?.stack?.map(item => item.toLowerCase()) || [];

    const knownDBs = ['mysql', 'postgresql', 'mongodb', 'dynamodb', 'sqlite', 'redis'];
    const overlap = backendNames.filter(name =>
        dbNames.includes(name) || knownDBs.some(db => name.includes(db))
    );

    if (overlap.length) {
        console.warn("⚠️ Detected redundant DBs in both backend and database sections:", overlap);
    }
}

export default { analyzeWebsite };
