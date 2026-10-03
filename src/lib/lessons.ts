// Lesson content for the "Tech Stack Essentials" track. Pure data.

export interface Lesson {
  id: string;
  title: string;
  description: string;
  icon: 'lovable' | 'github' | 'cursor' | 'firebase' | 'typescript' | 'tailwind';
  color: string;
  timeEstimate: string;
  whatIs: string;
  whyImportant: string;
  keyFeatures: string[];
  howWeUse: string;
  quickTips: string[];
  videoUrl?: string;
  resources: { title: string; url: string }[];
}

/** In the order students meet the tools during a build. */
export const LESSONS: Lesson[] = [
  {
    id: 'lovable',
    title: 'Lovable — AI app builder',
    description: 'Turns a written description into a working app you can click through',
    icon: 'lovable',
    color: 'from-pink-500 to-rose-500',
    timeEstimate: '8 min',
    whatIs:
      'Lovable is an AI app builder. You describe the app you want in plain English and it writes a real React + TypeScript project, with a live preview you can click around in.',
    whyImportant:
      'It lets you focus on what your app should do while it handles most of the code. You get a working, good-looking first version in minutes instead of weeks — then improve it by chatting.',
    keyFeatures: [
      'Plain-English prompts become real code',
      'Live preview while it builds',
      'Modern stack: React, TypeScript, Tailwind CSS, shadcn/ui',
      'Two-way sync with GitHub',
      'One-click publishing to a shareable link',
    ],
    howWeUse:
      'The Idea Workshop writes a Lovable prompt for your project. You paste it into Lovable to build the screens with sample data, then keep refining by asking for one change at a time.',
    quickTips: [
      'Be specific: name the screens, what is on them, and how they connect',
      'Ask for one change at a time and check the preview after each',
      'Use version history to undo a change that went wrong',
      'Connect GitHub early so your code is always backed up',
    ],
    resources: [{ title: 'Lovable documentation', url: 'https://docs.lovable.dev' }],
  },
  {
    id: 'github',
    title: 'GitHub — version control',
    description: 'A time machine for your code, and your public portfolio',
    icon: 'github',
    color: 'from-gray-700 to-gray-900',
    timeEstimate: '15 min',
    whatIs:
      'Git records every change you make to your code. GitHub stores those Git repositories online so your code is backed up, shareable, and easy to work on from different tools.',
    whyImportant:
      'You can always go back to a version that worked. Lovable and Cursor both work with GitHub, so it is how your code moves between them. Employers look at GitHub to see what you have built.',
    keyFeatures: [
      'Full history of every change (commits)',
      'Branches for trying ideas safely',
      'Backup of your code in the cloud',
      'README pages that show off your project',
      'Works with Lovable, Cursor and most hosting services',
    ],
    howWeUse:
      'You connect your Lovable project to GitHub, clone it to your computer, and open it in Cursor. Every time you finish a small piece of work you commit and push it.',
    quickTips: [
      'Commit small changes with clear messages, e.g. "Add login page"',
      'Run git pull before you start working to get the latest changes',
      'Never commit passwords or secret keys',
      'Write a short README with a screenshot and a live link',
    ],
    videoUrl: 'https://www.youtube-nocookie.com/embed/pBy1zgt0XPc',
    resources: [
      { title: 'GitHub "Hello World" tutorial', url: 'https://docs.github.com/en/get-started/start-your-journey/hello-world' },
      { title: 'About Git', url: 'https://docs.github.com/en/get-started/using-git/about-git' },
    ],
  },
  {
    id: 'cursor',
    title: 'Cursor — AI code editor',
    description: 'A code editor with an AI pair-programmer that reads your whole project',
    icon: 'cursor',
    color: 'from-blue-500 to-cyan-500',
    timeEstimate: '10 min',
    whatIs:
      'Cursor is a code editor based on VS Code with AI built in. Its chat can read your project, make changes across many files, explain code, and help fix errors.',
    whyImportant:
      'Once your screens exist, Cursor is where you add the real functionality — accounts, saving data, security rules — and where you learn what the code is actually doing.',
    keyFeatures: [
      'Chat that understands your whole codebase',
      'Edits across multiple files that you review before accepting',
      'Inline edits on selected code',
      'Explains errors and suggests fixes',
      'Built-in terminal and Git tools',
    ],
    howWeUse:
      'You open your cloned project in Cursor, paste the Cursor prompt from your project page into the chat, and work through it one step at a time — testing and committing after each step.',
    quickTips: [
      'Open the chat with Ctrl+L (Cmd+L on Mac)',
      'Select code and press Ctrl+K (Cmd+K) to edit just that part',
      'Read each change before accepting it; ask "explain this change" if unsure',
      'Paste the full error message when asking for help with a bug',
    ],
    resources: [{ title: 'Cursor documentation', url: 'https://docs.cursor.com' }],
  },
  {
    id: 'firebase',
    title: "Firebase — your app's backend",
    description: 'Accounts, a database and hosting without running your own server',
    icon: 'firebase',
    color: 'from-orange-500 to-red-500',
    timeEstimate: '12 min',
    whatIs:
      "Firebase is Google's backend platform. It gives your app user accounts (Authentication), a database (Firestore), file storage, and hosting — all usable straight from your frontend code.",
    whyImportant:
      'Building and running a server is a lot of work. Firebase gives you secure, scalable building blocks on a generous free tier, so you can ship a real app quickly.',
    keyFeatures: [
      'Authentication — email/password and Google sign-in',
      'Firestore — a database that updates your app in real time',
      'Security rules — decide exactly who can read and write what',
      'Hosting — deploy your app with one command',
      'Storage — upload images and files',
    ],
    howWeUse:
      'Your Cursor prompt walks you through adding Firebase to your project. CompanAI itself runs on Firebase too: your account and projects are stored in Firestore.',
    quickTips: [
      'Write security rules early — the default "test mode" lets anyone read your data',
      'Use the Firebase console to look at your data while you build',
      'Add your live website to Authentication → Settings → Authorized domains',
      'The free Spark plan is enough for learning projects',
    ],
    resources: [
      { title: 'Firestore documentation', url: 'https://firebase.google.com/docs/firestore' },
      { title: 'Firebase Hosting quickstart', url: 'https://firebase.google.com/docs/hosting/quickstart' },
    ],
  },
  {
    id: 'typescript',
    title: "TypeScript — JavaScript's safer sibling",
    description: 'Catches mistakes before your users do',
    icon: 'typescript',
    color: 'from-blue-600 to-indigo-600',
    timeEstimate: '10 min',
    whatIs:
      'TypeScript is JavaScript plus types: you say what kind of data a variable holds (text, number, a user object…) and your editor warns you when the code does not match.',
    whyImportant:
      'Many bugs are simple mix-ups like passing a number where text was expected. TypeScript catches these while you type, and gives you much better autocomplete.',
    keyFeatures: [
      'Finds errors before the app runs',
      'Smarter autocomplete in Cursor and VS Code',
      'Types document what your data looks like',
      'Safer renaming and refactoring',
      'Works with all JavaScript libraries',
    ],
    howWeUse:
      'Lovable projects use TypeScript by default. You do not need to master it first — read the red squiggles, and ask Cursor to explain any error you do not understand.',
    quickTips: [
      'Start with string, number, boolean and arrays like string[]',
      'Use an interface to describe the shape of an object',
      'Hover over a variable to see its type',
      'Avoid "any" — it switches the safety checks off',
    ],
    resources: [
      { title: 'TypeScript in 5 minutes', url: 'https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html' },
      { title: 'TypeScript handbook', url: 'https://www.typescriptlang.org/docs/' },
    ],
  },
  {
    id: 'tailwind',
    title: 'Tailwind CSS — styling made simple',
    description: 'Style your app with small, readable class names',
    icon: 'tailwind',
    color: 'from-cyan-500 to-teal-500',
    timeEstimate: '8 min',
    whatIs:
      'Tailwind CSS is a set of small styling classes you put straight on your HTML, like bg-purple-600 (purple background), p-4 (padding) or text-center.',
    whyImportant:
      'You can see how something is styled just by reading it, designs stay consistent, and AI tools are very good at writing Tailwind — so it is easy to ask for visual changes.',
    keyFeatures: [
      'Utility classes for spacing, colour, layout and type',
      'Responsive design with sm:, md:, lg: prefixes',
      'Consistent spacing and colour scales',
      'Dark mode support',
      'Works great with React components',
    ],
    howWeUse:
      'Everything Lovable generates is styled with Tailwind. When you want a visual change, you can ask Lovable or Cursor in plain English, or edit the classes yourself.',
    quickTips: [
      'Spacing: p- (padding), m- (margin), gap- (space between items)',
      'Phone first: write the mobile style, then add md: for bigger screens',
      'Try ideas instantly in Tailwind Play',
      'Search the docs for any property, e.g. "rounded corners"',
    ],
    resources: [
      { title: 'Tailwind CSS documentation', url: 'https://tailwindcss.com/docs' },
      { title: 'Tailwind Play (online editor)', url: 'https://play.tailwindcss.com/' },
    ],
  },
];
