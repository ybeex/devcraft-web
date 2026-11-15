# DevCraft: Seven build-in-public blog drafts

These drafts are written from the current web and API repositories. They describe the product as an evolving, deployed build, and avoid treating marketing counters or old checkpoint figures as independently verified user outcomes. The first-person voice is intentional; add your own specific moments and dates before publishing.

## 1. I built a developer-learning platform alone. Here is what “done” actually means.

**Topic:** The solo-founder journey from idea to a deployed web and API product, including scope, trade-offs, and the gap between shipping and proving value.

**Suggested audience:** Developers considering building a product alone; early-stage founders.

**Draft**

For a long time, the whole team behind DevCraft was me, my laptop, and a growing collection of AI agents. There was no launch room full of people watching the build. No one knew what I was trying to make, what I had just fixed, or why a small technical decision had taken most of an evening.

That is a strange way to build something. It is also a useful way to learn what the work really contains.

DevCraft is a learning platform for frontend and backend engineering. A learner can follow structured tracks, work through lessons in an editor, run code against checks, ask an AI tutor for help, practice interview questions, and build projects. The web app is deployed. The API is deployed. The product is still under active development.

Those sentences belong together. “Deployed” means people can reach the product. It does not mean every feature is finished, every integration has been validated against real production traffic, or the learning experience has been proven with a broad set of learners. I am learning to treat those as different milestones instead of collapsing them into one launch badge.

The codebase grew beyond a landing page. The frontend is a Next.js application with a learner dashboard, curriculum maps, lesson workspaces, project and community flows, interview practice, a playground, and admin tools. The API is built with Fastify and PostgreSQL, with Redis, authentication, progress tracking, sandboxed execution, AI features, and content management. Each new capability added another set of edges: browser state, API contracts, access rules, failure handling, and the operational work to keep it running.

Agents helped me move faster through implementation and review. They did not remove the need to decide what the product should promise, inspect whether the code matched that promise, or own the systems after deployment. I still had to make the calls and carry the context between two repositories. The agents were useful collaborators, not a substitute for product judgment.

The hardest change in perspective has been from “Can I build this?” to “Can someone learn from it, trust it, and come back to it?” A passing build is evidence that the app compiles. A passing test suite is evidence about the cases the suite covers. Neither tells me whether the explanation is clear to a beginner or whether a learner can recover from being stuck.

So the next chapter is less glamorous than adding another module: watch people use the product, find where the path breaks, validate the real integrations, and improve the parts that matter. The ambition remains large: help people move from learning concepts to shipping credible engineering work. The current product is a real start, not the finish line.

Building alone can make progress feel invisible. Writing down the work is my way of making the decisions, discoveries, and unfinished edges visible—and inviting other people into the process while there is still room to shape it.

**Closing prompt:** If you have built a product solo, what helped you move from “it runs” to “someone can rely on it”?

## 2. Why DevCraft teaches through code you can run

**Topic:** The product and curriculum choice to make practice executable rather than relying only on passive explanations.

**Suggested audience:** Self-taught developers, educators, and people designing technical learning tools.

**Draft**

It is possible to read about a concept, understand the explanation, and still be unable to use it when a blank editor is open.

That gap is why DevCraft puts executable practice near the center of its learning experience. In a lesson, the learner works in an editor, runs code, sees checks, and can ask for a hint or an explanation. The goal is to make the learner do the thinking while the platform helps them see what happened.

This choice changes what a lesson needs to contain. A paragraph alone is not enough. There must be a task with a clear expectation, starter code that makes the first step approachable, checks that distinguish a working solution from a broken one, and feedback that points toward the relevant idea. The test itself becomes part of the teaching design.

That last part is easy to underestimate. A weak test can reward code that only looks right. A test that exposes the answer can turn practice into copying. A learner can also find shortcuts in an evaluator that its author did not anticipate. We have been building content checks so each exercise's intended solution passes and an untouched starter does not. That is a useful baseline, but it is not a substitute for seeing how a real learner interprets the task.

The API runs supported code in constrained execution environments. It also includes checks for some domain-specific lessons, such as HTML and SQL. This is an engineering responsibility as much as a product feature: submitted code is untrusted input. Execution needs limits, isolation, and clear failure behavior. A learning tool should never confuse “the learner's code crashed” with “the whole service should be at risk.”

Executable practice also makes the experience more honest. Instead of telling someone they understand a concept because they reached the bottom of a page, we can ask them to apply it. That still does not prove durable understanding. It does give both learner and product a more useful signal than passive completion alone.

The long-term ambition is a path from foundations to the kind of work engineers actually do: build interfaces, design APIs, reason about data and security, and explain technical decisions. The current tracks span frontend and backend topics, with project work and interview practice alongside lessons. The path is still being refined, and the next improvement should come from learner evidence, not just from adding more content.

The central question is not “How many lessons can we publish?” It is “After this lesson, can someone solve a slightly different problem on their own?” Runnable code is one way to get closer to that answer.

**Closing prompt:** What makes a coding exercise feel like practice rather than a disguised answer key?

## 3. An AI tutor should help you think, not take the keyboard

**Topic:** How DevCraft uses AI for hints, error explanations, code review, and interview feedback while keeping learning responsibility with the learner.

**Suggested audience:** Developers using AI to learn; builders integrating models into education products.

**Draft**

When an AI tutor can produce a complete solution in seconds, it is tempting to treat that as the definition of useful help. In a learning product, it can be the opposite.

If the goal is to practice solving a problem, an answer that skips the reasoning may create short-term progress and long-term dependency. I want DevCraft's AI tools to act more like a patient reviewer: offer a nudge, help interpret an error, point out a risk in code, or give feedback on an interview response—while leaving the learner responsible for the next move.

The product currently exposes several AI assistance patterns, including hints, error explanation, code review, and mock interview feedback. The API routes these through model choices suited to different tasks and keeps the learner's lesson code away from the model when the feature does not need it. Prompts and inputs are bounded and checked, and AI use is subject to account limits. Those controls are part of making the feature dependable, not just plumbing around a chat box.

There are real trade-offs. A model can be confidently wrong. It can give away too much, misunderstand a partial solution, or explain a bug at the wrong level. Model selection involves quality, speed, and cost. A tutor response that is technically correct but poorly timed can still interrupt the learning process.

That is why “we added AI” is not the finish line. The useful questions are more specific: Did the hint help someone make their own next step? Did the error explanation connect the message to a concept? Did the review catch something meaningful without overwhelming the learner? Could the learner tell when the model was uncertain?

Some of DevCraft's AI interactions currently keep conversation history in the browser rather than offering server-side conversational memory. This keeps the interaction simple, but it also means context across separate requests is limited. That is a product constraint worth understanding, especially when someone expects an ongoing tutor conversation.

My working principle is straightforward: AI should increase the learner's agency. It can make a useful next step easier to see; it should not make the learner disappear from the work. The only way to know whether the balance is right is to observe real sessions, listen to learners, and adjust the behavior where it helps or distracts.

**Closing prompt:** When an AI assistant helps you learn, what kind of help leaves you more capable afterward?

## 4. The lesson runs your code. That makes safety part of the curriculum.

**Topic:** The backend and security work behind executing untrusted learner code, and why “Run” is not a trivial button.

**Suggested audience:** Developer-tool builders, engineering educators, backend and security engineers.

**Draft**

A “Run code” button looks small on a screen. On the server, it represents a promise: the learner can experiment without their mistake becoming everyone else's outage.

DevCraft's lessons and playground support runnable practice. That means the API has to treat submitted programs as untrusted. They might use too much CPU, consume memory indefinitely, or try to reach services they should not be able to access. The learning experience depends on experimentation; the platform depends on keeping that experimentation bounded.

The backend is built around Fastify, PostgreSQL, and Redis, with an execution layer for supported languages. The application adds request validation, rate limits, authentication controls, and service-side checks around features such as premium content. The execution path has its own constraints. No single guard is enough: validation does not contain a running process, and a timeout does not decide whether a user is allowed to call an endpoint.

Security work often looks like a list of details rather than a visible feature. Refresh tokens should not be stored as raw credentials. Mutating requests need well-defined retry behavior. AI calls need limits and careful input handling. Database queries must remain parameterized. A logout should have a clear relationship to session revocation. Each detail protects a different boundary.

The product also needs honest failure messages. A learner should be able to tell whether their code failed a check, their syntax was invalid, a time limit was reached, or the service itself could not complete the request. If every failure becomes “Something went wrong,” users cannot learn from it and operators cannot diagnose it quickly.

Some backend paths have been covered by automated and live tests in documented development checkpoints. External validation against real providers is a separate step, and current project notes still call out integrations that need that validation. I do not want a test double to be mistaken for proof that the production service behaves identically.

This is the less visible side of educational software: the platform is teaching engineering while also needing to practice it. The learner sees an editor and a result. Behind that result sits a set of boundaries that make experimentation safe enough to be useful.

**Closing prompt:** What is the least visible reliability feature you would want in a coding platform?

## 5. The curriculum is a product surface, not a folder of articles

**Topic:** Structuring a frontend and backend curriculum as a progression, and the content tooling required to maintain it.

**Suggested audience:** Technical educators, curriculum designers, documentation and developer-tool teams.

**Draft**

The easiest way to publish a curriculum is to collect topics and put them in a list. The hard part is deciding what a learner should be able to do after each topic, how one skill supports another, and what “ready for the next step” means.

DevCraft organizes learning into frontend and backend tracks, with modules covering areas such as HTML and accessibility, CSS layout, JavaScript, TypeScript, React, APIs, databases, authentication, deployment, and system design. In the product, the curriculum appears as a mapped path rather than only as a sequence of article links. Each lesson can include instructions, starter code, a solution, and checks.

That structure makes the authoring process consequential. Content must be technically accurate, but it also has to fit the learner's current knowledge. A lesson on idempotency keys is more useful after the learner has seen the problem of retries. A database exercise needs a schema and expected behavior that are clear enough to reason about. The path between these ideas is part of the product.

As the lesson count grows, content needs tooling. The API repository uses a text-based format for lessons and interview questions, then loads that content through a seed process. This keeps long explanations and code samples readable without hiding them inside deeply escaped TypeScript strings. It also makes it practical to verify content before it reaches a database.

We have checks for lesson fixtures that run intended solutions and confirm untouched starters do not pass. Compatibility matters too: if the execution environment targets an older runtime or compiler, examples must work there, not just on the machine that authored them. Automated checks catch many mechanical errors. They cannot tell whether the explanation feels confusing at minute seven or whether the exercise is motivating enough to finish.

The frontend also includes placement and recommendation flows intended to help learners find a starting point. Those flows raise a hard design question: how do you place someone accurately without turning a first session into an exam? Current development notes identify richer code-reading questions and a more thoughtful difficulty ladder as areas to improve.

The ambition is depth that leads to practice: learn a concept, apply it, see evidence, then use it in a larger project. The current curriculum is an evolving system. Its quality will depend not only on the number of lessons, but on whether the transitions between them make sense to the people taking the path.

**Closing prompt:** What made a technical learning path feel coherent to you rather than like a collection of unrelated tutorials?

## 6. What it takes to deploy two halves of one product

**Topic:** The coordination and operational lessons of deploying a Next.js frontend alongside a separate API.

**Suggested audience:** Full-stack developers, solo founders, people shipping their first multi-service app.

**Draft**

DevCraft has two repositories because it has two distinct jobs. The web app presents lessons, editors, dashboards, and the learner's progress. The API owns application rules, accounts, content, persistence, and integrations. Getting both deployed is a milestone. Getting them to behave like one product is the real work.

The web app is built with Next.js, React, and TypeScript. The API uses Fastify, Drizzle, PostgreSQL, and Redis. The browser talks to versioned API routes, and the frontend code has to agree with the API about shapes, authentication, pagination, and error behavior. When those contracts drift, a page can compile cleanly and still fail at runtime.

Deployment makes hidden assumptions visible. Which origin is allowed to call the API? Does the browser have the right API base URL? Are refresh and access tokens handled consistently? What happens when the database is slow, the cache is unavailable, or an AI provider rejects a request? Are email links built from the correct public URL? Does a health check prove that the service is alive without accidentally exposing sensitive details?

There is also a difference between a process being up and a feature being proven. A health endpoint can report that the API is running. It does not prove that real email delivery works, the selected AI models are reachable, a code execution provider accepts the expected language IDs, or the learner journey is understandable. Those need their own checks.

The repositories include automated tests and documented integration work, and the frontend has been built and type-checked at checkpoints. Project notes also call for real-service validation on some external integrations. Keeping that distinction visible helps me avoid a common trap: treating “deployed” as a synonym for “finished.”

The most useful deployment habit has been to follow one user journey across both systems. Sign up, verify an account, open a lesson, run code, save progress, and return to the dashboard. A feature is only coherent when the browser, API, database, and supporting services agree on what just happened.

I have deployed DevCraft's web and API. Now I am working on the next standard: making the whole path reliable, observable, and clear enough that someone outside my own development environment can trust it.

**Closing prompt:** What end-to-end flow do you always verify after deploying a full-stack app?

## 7. Shipping is not the same as learning whether the product works

**Topic:** The current stage of DevCraft: building and deployment are complete milestones, but learner validation and product iteration remain.

**Suggested audience:** Early-stage founders, bootstrapped builders, anyone navigating the post-launch phase.

**Draft**

There is a satisfying moment when a feature finally works end to end. The editor loads. The API accepts the request. The database records the result. The dashboard reflects the new progress. After a long stretch of building, it is tempting to call that the proof.

It is proof of something: the path can work under the conditions tested. It is not yet proof that the feature solves the learner's problem, that the instructions make sense, or that the experience holds up outside the scenarios I anticipated.

DevCraft now has much of the product surface I set out to build: frontend and backend tracks, lessons with code execution, AI assistance, projects, community features, interview and system-design practice, a playground, account flows, and administrative tools. The web app and API are deployed. This is a meaningful change from an idea on my laptop.

The next work is a different kind of hard. A curriculum can contain good material and still lose a learner between modules. An AI hint can be accurate and still arrive too early. A placement test can be technically balanced and still feel stressful. An interface can look polished and hide a confusing next step. These are not questions I can settle by adding another route.

Some current development notes already point to concrete improvement areas: richer placement questions, more nuanced streak behavior, onboarding and placement funnel visibility, and careful validation of real external integrations. Those notes are not a verdict on the product. They are a map of what remains to be understood.

My next milestone is not a bigger launch announcement. It is a tighter learning loop: invite people into the product, watch where they pause, ask what they expected, and prioritize fixes based on what they actually need. Then repeat. That may lead to code changes, but it may also lead to changing an explanation, simplifying a workflow, or removing an assumption I was attached to.

I have spent a long time building in private. The product is at a point where building in public can improve the work. I want to share the decisions and the rough edges, and hear from people who are learning or teaching engineering. Not because every opinion should become a feature, but because the product should be shaped by more than its builder's point of view.

“Deployed” is a milestone I am proud of. “Useful to learners” is the outcome I still need to earn.

**Closing prompt:** If you are learning frontend or backend engineering, where do you most often get stuck between understanding a concept and applying it?
