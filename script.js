/* ===========================
   SKILL GAP ANALYZER — script.js
   Real skill-matching logic (no external API)
=========================== */

// ─── Word Counter ──────────────────────────────────────────────────────────
function countWords(text) {
  return text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
}

document.getElementById('resume-input').addEventListener('input', function () {
  document.getElementById('resume-count').textContent = countWords(this.value) + ' words';
});
document.getElementById('jd-input').addEventListener('input', function () {
  document.getElementById('jd-count').textContent = countWords(this.value) + ' words';
});

// ─── Predefined Skills Library ─────────────────────────────────────────────
const SKILLS_LIST = [
  // Web fundamentals
  "html", "css", "bootstrap", "tailwind", "sass",
  // JavaScript ecosystem
  "javascript", "typescript", "react", "angular", "vue", "next.js", "node.js", "express",
  // Python ecosystem
  "python", "django", "flask", "fastapi",
  // Data science / ML
  "machine learning", "deep learning", "tensorflow", "pytorch", "keras",
  "pandas", "numpy", "scikit-learn", "matplotlib", "jupyter",
  // JVM / backend
  "java", "spring boot", "spring", "kotlin", "scala",
  // Databases
  "sql", "mysql", "postgresql", "mongodb", "redis", "sqlite", "oracle",
  // Cloud & DevOps
  "aws", "azure", "gcp", "docker", "kubernetes", "terraform", "ansible",
  "ci/cd", "jenkins", "github actions", "linux",
  // APIs & architecture
  "rest api", "graphql", "microservices",
  // Version control
  "git", "github", "gitlab",
  // Mobile
  "react native", "flutter", "android", "ios",
  // Other languages & tools
  "matlab", "c++", "c#", ".net", "php", "ruby", "rust", "golang"
];

// ─── Main Analyze Function ─────────────────────────────────────────────────
function analyzeSkills() {
  const resume = document.getElementById('resume-input').value.trim();
  const jd     = document.getElementById('jd-input').value.trim();

  if (!resume || !jd) {
    showError(!resume ? 'resume-card' : 'jd-card', 'Please fill in this field.');
    return;
  }

  setLoading(true);
  hideResults();

  setTimeout(() => {
    const resumeLower = resume.toLowerCase();
    const jdLower     = jd.toLowerCase();

    // Skills detected in the resume (shown in "Your Skills" — always populated)
    const userSkills = SKILLS_LIST.filter(skill => skill.length >= 3 && resumeLower.includes(skill));

    // Skills detected in the job description
    let jobSkills = SKILLS_LIST.filter(skill => skill.length >= 3 && jdLower.includes(skill));

    // ── Fallback: if nothing matched the JD from the predefined list,
    //    extract raw capitalised/known tech words directly from the JD text
    //    so the app never produces empty results.
    if (jobSkills.length === 0) {
      jobSkills = extractKeywordsFromText(jdLower);
    }

    // matchedSkills  = skills the candidate already has that the job wants
    const matchedSkills = userSkills.filter(skill => jobSkills.includes(skill));

    // missingSkills  = what the job needs that the candidate lacks
    const missingSkills = jobSkills.filter(skill => !userSkills.includes(skill));

    // Readiness score: matched / (matched + missing) — reflects true overlap quality
    const total = matchedSkills.length + missingSkills.length;
    const readinessPercent = total > 0
      ? Math.round((matchedSkills.length / total) * 100)
      : 0;

    const readinessSummary = buildSummary(readinessPercent, matchedSkills.length, missingSkills.length);

    // Roadmap: one step per missing skill
    const roadmap = missingSkills.map((skill, index) => ({
      step:        index + 1,
      title:       `Learn ${toTitleCase(skill)}`,
      description: `Understand the basics and build small projects using ${toTitleCase(skill)} to strengthen your portfolio.`,
      resource:    'YouTube / Official Documentation'
    }));

    renderResults({
      userSkills,        // ALL resume skills → "Your Skills" card
      matchedSkills,     // intersection only → matched count in meta bar
      missingSkills,     // job skills absent from resume → "Missing Skills" card
      readinessPercent,
      readinessSummary,
      roadmap
    });
    setLoading(false);
  }, 600);
}

// ─── Fallback keyword extractor ────────────────────────────────────────────
// Called only when the JD contains no skills from SKILLS_LIST.
// Looks for consecutive alphabetic tokens that look like tech terms
// (length ≥ 3, not common English stop-words).
function extractKeywordsFromText(text) {
  const stopWords = new Set([
    "the","and","for","are","with","that","this","you","have","from",
    "will","our","your","not","but","can","all","any","its","their",
    "was","has","been","they","who","what","how","when","where","use",
    "also","both","each","more","such","than","then","them","well",
    "able","about","into","over","after","able","should","must","would",
    "knowledge","experience","skills","looking","candidate","strong",
    "working","years","team","role","required","position","develop",
    "build","design","work","good","excellent","including","related"
  ]);

  // Tokenise: words and hyphenated compounds (e.g. "ci-cd", "end-to-end")
  const tokens = text.match(/[a-z][a-z0-9.#+\-]*[a-z0-9]/g) || [];

  const seen = new Set();
  const keywords = [];
  for (const token of tokens) {
    if (token.length >= 3 && !stopWords.has(token) && !seen.has(token)) {
      seen.add(token);
      keywords.push(token);
    }
  }

  // Cap at 12 so the UI doesn't overflow
  return keywords.slice(0, 12);
}

// ─── Helper: build a concise readiness summary ────────────────────────────
function buildSummary(pct, matched, missing) {
  if (pct === 100) return 'Excellent — you match every required skill in this job description!';
  if (pct >= 75)  return `Strong profile! Polish ${missing} remaining skill${missing !== 1 ? 's' : ''} to become a top candidate.`;
  if (pct >= 50)  return `Good foundation with ${matched} matched skill${matched !== 1 ? 's' : ''}. Bridge the gaps to boost your chances.`;
  if (pct > 0)    return `Some overlap found. Focus on acquiring the ${missing} missing skill${missing !== 1 ? 's' : ''} for this role.`;
  return 'No skill overlap detected — start with the roadmap below to build the required skills.';
}

// ─── Helper: Title Case a skill string ───────────────────────────────────
function toTitleCase(str) {
  return str.replace(/\b\w/g, c => c.toUpperCase());
}

// ─── Render Results ────────────────────────────────────────────────────────
function renderResults(data) {
  // Readiness bar
  const pct = Math.min(100, Math.max(0, data.readinessPercent));
  document.getElementById('readiness-percent').textContent = pct + '%';
  const intersectionCount = data.matchedSkills ? data.matchedSkills.length : 0;
  const resumeSkills      = data.userSkills    || data.matchedSkills || [];
  document.getElementById('readiness-meta').innerHTML =
    `<span><i class="fa-solid fa-circle-check" style="color:var(--green)"></i> ${resumeSkills.length} resume skills</span>
     <span><i class="fa-solid fa-bullseye" style="color:var(--blue-light)"></i> ${intersectionCount} matched to job</span>
     <span><i class="fa-solid fa-circle-xmark" style="color:var(--red)"></i> ${data.missingSkills.length} skills to learn</span>
     <span style="flex:1;text-align:right;font-style:italic;">${data.readinessSummary || ''}</span>`;

  // Animate progress bar after brief delay
  setTimeout(() => {
    document.getElementById('progress-fill').style.width = pct + '%';
    document.getElementById('progress-glow').style.width = pct + '%';
  }, 200);

  // Skill tags — "Your Skills" shows ALL resume skills; "Missing" shows gaps
  renderSkillTags('skills-list', resumeSkills,       'tag-green', 'fa-check');
  renderSkillTags('missing-list', data.missingSkills, 'tag-red',   'fa-xmark');

  document.getElementById('skills-count').textContent =
    `${resumeSkills.length} skill${resumeSkills.length !== 1 ? 's' : ''} found`;
  document.getElementById('missing-count').textContent =
    `${data.missingSkills.length} skill${data.missingSkills.length !== 1 ? 's' : ''} to acquire`;

  // Roadmap
  renderRoadmap(data.roadmap);

  // Show results
  showResults();
}

function renderSkillTags(containerId, skills, tagClass, iconClass) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  if (!skills || skills.length === 0) {
    container.innerHTML = '<div class="empty-state"><i class="fa-regular fa-circle-question"></i>No data found</div>';
    return;
  }
  skills.forEach((skill, i) => {
    const tag = document.createElement('span');
    tag.className = `skill-tag ${tagClass}`;
    tag.style.animationDelay = `${i * 60}ms`;
    tag.innerHTML = `<i class="fa-solid ${iconClass}"></i>${escapeHtml(skill)}`;
    container.appendChild(tag);
  });
}

function renderRoadmap(roadmap) {
  const container = document.getElementById('roadmap-list');
  container.innerHTML = '';
  if (!roadmap || roadmap.length === 0) {
    container.innerHTML = '<div class="empty-state"><i class="fa-regular fa-map"></i>No roadmap generated</div>';
    return;
  }
  roadmap.forEach((item, i) => {
    const step = document.createElement('div');
    step.className = 'roadmap-step';
    step.style.animationDelay = `${i * 100}ms`;
    step.innerHTML = `
      <div class="step-number">${item.step || i + 1}</div>
      <div class="step-body">
        <div class="step-title">${escapeHtml(item.title)}</div>
        <div class="step-desc">${escapeHtml(item.description)}</div>
      </div>
    `;
    container.appendChild(step);
  });
}

// ─── UI State Helpers ──────────────────────────────────────────────────────
function setLoading(on) {
  const btn = document.getElementById('analyze-btn');
  const loader = document.getElementById('btn-loader');
  const content = btn.querySelector('.btn-content');
  btn.disabled = on;
  if (on) {
    loader.classList.add('active');
    content.style.opacity = '0';
  } else {
    loader.classList.remove('active');
    content.style.opacity = '1';
  }
}

function showResults() {
  const section = document.getElementById('results-section');
  section.classList.add('visible');
  // Scroll into view after a tick
  setTimeout(() => {
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);
}

function hideResults() {
  const section = document.getElementById('results-section');
  section.classList.remove('visible');
  document.getElementById('progress-fill').style.width = '0%';
  document.getElementById('progress-glow').style.width = '0%';
  document.getElementById('readiness-percent').textContent = '0%';
}

function resetAnalysis() {
  hideResults();
  document.getElementById('resume-input').value = '';
  document.getElementById('jd-input').value = '';
  document.getElementById('resume-count').textContent = '0 words';
  document.getElementById('jd-count').textContent = '0 words';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showError(cardId, message) {
  const card = document.getElementById(cardId);
  card.style.borderColor = 'rgba(248,113,113,0.5)';
  card.style.boxShadow = '0 0 20px rgba(248,113,113,0.1)';
  const textarea = card.querySelector('.textarea');
  if (textarea) {
    textarea.focus();
    textarea.style.borderColor = 'rgba(248,113,113,0.5)';
    setTimeout(() => {
      card.style.borderColor = '';
      card.style.boxShadow = '';
      textarea.style.borderColor = '';
    }, 2500);
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── File Upload Handlers ──────────────────────────────────────────────────
function handleFileUpload(inputId, textareaId, countId) {
  const fileInput = document.getElementById(inputId);
  fileInput.addEventListener('change', function () {
    const file = this.files[0];
    if (!file) return;

    const name = file.name.toLowerCase();

    if (name.endsWith('.txt')) {
      // ── Plain text ──────────────────────────────────────────────────────
      const reader = new FileReader();
      reader.onload = function (e) {
        const textarea = document.getElementById(textareaId);
        textarea.value = e.target.result;
        document.getElementById(countId).textContent = countWords(e.target.result) + ' words';
      };
      reader.readAsText(file);

    } else if (name.endsWith('.pdf')) {
      // ── PDF via pdf.js ──────────────────────────────────────────────────
      const reader = new FileReader();
      reader.onload = async function (e) {
        try {
          const typedArray = new Uint8Array(e.target.result);
          const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;
          let fullText = '';

          for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const content = await page.getTextContent();
            const pageText = content.items.map(item => item.str).join(' ');
            fullText += pageText + '\n';
          }

          const textarea = document.getElementById(textareaId);
          textarea.value = fullText.trim();
          document.getElementById(countId).textContent = countWords(fullText) + ' words';
        } catch (err) {
          alert('Could not read PDF. Please paste text manually.');
        }
      };
      reader.readAsArrayBuffer(file);

    } else {
      alert('PDF/DOC parsing not supported yet. Please paste text.');
      this.value = '';
    }
  });
}

handleFileUpload('resume-file', 'resume-input', 'resume-count');
handleFileUpload('jd-file',     'jd-input',     'jd-count');

// ─── Scroll Animations ─────────────────────────────────────────────────────
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in'); });
}, { threshold: 0.1 });

document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));