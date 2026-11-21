// Security tripwires for firestore.rules. Run with `npm run test:rules` (starts the emulator).
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { deleteDoc, doc, getDoc, getDocs, collection, query, where, orderBy, setDoc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';

let env: RulesTestEnvironment;

const project = (ownerId: string, extra: Record<string, unknown> = {}) => ({
  ownerId,
  title: 'StudyBuddy',
  description: 'Find study partners',
  features: ['Chat'],
  techStack: ['React'],
  prompts: { lovable: 'L', cursor: 'C' },
  promptsSource: 'ai',
  completedSteps: [],
  status: 'planning',
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  ...extra,
});

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-companai-rules',
    firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8085 },
  });
});

beforeEach(async () => {
  await env.clearFirestore();
});

afterAll(async () => {
  await env?.cleanup();
});

const alice = () => env.authenticatedContext('alice').firestore();
const bob = () => env.authenticatedContext('bob').firestore();
const anon = () => env.unauthenticatedContext().firestore();

async function seed(path: string, data: Record<string, unknown>) {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), path), data);
  });
}

describe('projects', () => {
  it('owner can create, read, update and delete their project', async () => {
    const ref = doc(alice(), 'projects/p1');
    await assertSucceeds(setDoc(ref, project('alice')));
    await assertSucceeds(getDoc(ref));
    await assertSucceeds(updateDoc(ref, { completedSteps: ['lovable'], status: 'building' }));
    await assertSucceeds(deleteDoc(ref));
  });

  it('cannot create a project owned by someone else', async () => {
    await assertFails(setDoc(doc(alice(), 'projects/p1'), project('bob')));
  });

  it("other users and signed-out visitors cannot read, change or delete it", async () => {
    await seed('projects/p1', project('alice'));
    await assertFails(getDoc(doc(bob(), 'projects/p1')));
    await assertFails(getDoc(doc(anon(), 'projects/p1')));
    await assertFails(updateDoc(doc(bob(), 'projects/p1'), { title: 'hacked' }));
    await assertFails(deleteDoc(doc(bob(), 'projects/p1')));
  });

  it('owner cannot hand the project to another user', async () => {
    await seed('projects/p1', project('alice'));
    await assertFails(updateDoc(doc(alice(), 'projects/p1'), { ownerId: 'bob' }));
  });

  it("list queries only work when filtered to the user's own projects", async () => {
    await seed('projects/a', project('alice'));
    await seed('projects/b', project('bob'));
    await assertSucceeds(getDocs(query(collection(alice(), 'projects'), where('ownerId', '==', 'alice'), orderBy('updatedAt', 'desc'))));
    await assertFails(getDocs(query(collection(alice(), 'projects'), where('ownerId', '==', 'bob'))));
    await assertFails(getDocs(collection(alice(), 'projects')));
  });

  it('rejects oversized or malformed projects', async () => {
    await assertFails(setDoc(doc(alice(), 'projects/big'), project('alice', { title: 'x'.repeat(201) })));
    await assertFails(setDoc(doc(alice(), 'projects/big2'), project('alice', { prompts: { lovable: 'x'.repeat(60001), cursor: '' } })));
    await assertFails(setDoc(doc(alice(), 'projects/bad'), project('alice', { features: 'not a list' })));
    await assertFails(setDoc(doc(alice(), 'projects/notitle'), project('alice', { title: 42 })));
  });

  it('legacy project documents stay editable by their owner', async () => {
    await seed('projects/old', {
      ownerId: 'alice',
      title: 'Old',
      description: 'from v0',
      features: ['a'],
      techStack: ['React'],
      progress: { completedSteps: [1], currentStep: 1, totalSteps: 4 },
      prompts: { lovable: 'L', cursor: 'C' },
      resources: { links: [] },
    });
    await assertSucceeds(updateDoc(doc(alice(), 'projects/old'), { completedSteps: ['lovable', 'github'] }));
  });

  it('accepts structured features and a valid completionPct, rejects an out-of-range one', async () => {
    const structured = [{ id: 'f1', label: 'Chat', status: 'built' }];
    await assertSucceeds(setDoc(doc(alice(), 'projects/s1'), project('alice', { features: structured, completionPct: 100 })));
    await assertFails(setDoc(doc(alice(), 'projects/s2'), project('alice', { features: structured, completionPct: 150 })));
    await assertFails(setDoc(doc(alice(), 'projects/s3'), project('alice', { features: structured, completionPct: -1 })));
  });
});

describe('projects/{id}/buildReports', () => {
  const buildReport = (ownerId: string, projectId: string, extra: Record<string, unknown> = {}) => ({
    ownerId,
    projectId,
    source: 'lovable',
    extractionSource: 'fence',
    rawPaste: '```companai-report-v1\n{"features":[]}\n```',
    parsedFeatures: [{ id: 'f1', status: 'built' }],
    blockers: [],
    filesChanged: ['src/pages/Dashboard.tsx'],
    suggestedNextPrompt: '',
    submittedAt: serverTimestamp(),
    ...extra,
  });

  beforeEach(async () => {
    await seed('projects/p1', project('alice'));
    await seed('projects/p2', project('bob'));
  });

  it('owner can create, read, update and delete their report', async () => {
    const ref = doc(alice(), 'projects/p1/buildReports/r1');
    await assertSucceeds(setDoc(ref, buildReport('alice', 'p1')));
    await assertSucceeds(getDoc(ref));
    await assertSucceeds(updateDoc(ref, { parsedFeatures: [{ id: 'f1', status: 'partial' }] }));
    await assertSucceeds(deleteDoc(ref));
  });

  it("cannot create a report under someone else's project", async () => {
    await assertFails(setDoc(doc(alice(), 'projects/p2/buildReports/r1'), buildReport('alice', 'p2')));
  });

  it("cannot claim another user's ownership on a report under your own project", async () => {
    await assertFails(setDoc(doc(alice(), 'projects/p1/buildReports/r1'), buildReport('bob', 'p1')));
  });

  it("report's projectId must match its parent project", async () => {
    await assertFails(setDoc(doc(alice(), 'projects/p1/buildReports/r1'), buildReport('alice', 'p2')));
  });

  it('other signed-in users and anonymous visitors cannot read or write a report', async () => {
    await seed('projects/p1/buildReports/r1', buildReport('alice', 'p1'));
    await assertFails(getDoc(doc(bob(), 'projects/p1/buildReports/r1')));
    await assertFails(updateDoc(doc(bob(), 'projects/p1/buildReports/r1'), { source: 'cursor' }));
    await assertFails(deleteDoc(doc(bob(), 'projects/p1/buildReports/r1')));
    await assertFails(getDoc(doc(anon(), 'projects/p1/buildReports/r1')));
  });

  it('rejects an oversized paste or too many parsed features', async () => {
    await assertFails(setDoc(doc(alice(), 'projects/p1/buildReports/bad1'), buildReport('alice', 'p1', { rawPaste: 'x'.repeat(60001) })));
    const tooMany = Array.from({ length: 31 }, (_, i) => ({ id: `f${i + 1}`, status: 'pending' }));
    await assertFails(setDoc(doc(alice(), 'projects/p1/buildReports/bad2'), buildReport('alice', 'p1', { parsedFeatures: tooMany })));
  });

  it('owner cannot reassign a report to another owner on update', async () => {
    await seed('projects/p1/buildReports/r1', buildReport('alice', 'p1'));
    await assertFails(updateDoc(doc(alice(), 'projects/p1/buildReports/r1'), { ownerId: 'bob' }));
  });
});

describe('ideaDrafts', () => {
  it('a user owns exactly their own draft', async () => {
    await assertSucceeds(setDoc(doc(alice(), 'ideaDrafts/alice'), { step: 'describe', ideas: [] }));
    await assertSucceeds(getDoc(doc(alice(), 'ideaDrafts/alice')));
    await assertFails(getDoc(doc(bob(), 'ideaDrafts/alice')));
    await assertFails(setDoc(doc(bob(), 'ideaDrafts/alice'), { step: 'describe', ideas: [] }));
    await assertSucceeds(deleteDoc(doc(alice(), 'ideaDrafts/alice')));
  });

  it('caps the number of stored ideas', async () => {
    await assertFails(setDoc(doc(alice(), 'ideaDrafts/alice'), { ideas: [1, 2, 3, 4, 5, 6] }));
  });
});

describe('userProgress', () => {
  it('a user can record and read only their own lessons', async () => {
    await assertSucceeds(setDoc(doc(alice(), 'userProgress/alice'), { completedLessons: arrayUnion('lovable'), updatedAt: serverTimestamp() }, { merge: true }));
    await assertSucceeds(getDoc(doc(alice(), 'userProgress/alice')));
    await assertFails(getDoc(doc(bob(), 'userProgress/alice')));
    await assertFails(setDoc(doc(bob(), 'userProgress/alice'), { completedLessons: [] }));
  });

  it('rejects unexpected fields', async () => {
    await assertFails(setDoc(doc(alice(), 'userProgress/alice'), { completedLessons: [], isAdmin: true }));
  });
});

describe('users', () => {
  it('a user can create and read their own profile with the expected fields', async () => {
    await assertSucceeds(setDoc(doc(alice(), 'users/alice'), { name: 'Alice', email: 'a@example.com', createdAt: serverTimestamp() }));
    await assertSucceeds(getDoc(doc(alice(), 'users/alice')));
    await assertFails(getDoc(doc(bob(), 'users/alice')));
  });

  it('cannot write extra fields such as roles', async () => {
    await assertFails(setDoc(doc(alice(), 'users/alice'), { name: 'Alice', email: 'a@example.com', role: 'admin' }));
  });
});

describe('everything else is closed', () => {
  it.each(['conversations/c1', 'subscriptions/alice', 'learning-paths/tech-essentials', 'community/post1', 'ideaWorkflows/w1'])('%s', async (path) => {
    await assertFails(setDoc(doc(alice(), path), { userId: 'alice', ownerId: 'alice' }));
    await assertFails(getDoc(doc(alice(), path)));
  });
});
