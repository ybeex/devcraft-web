# DevCraft: LinkedIn and X posts for the seven blog topics

Fourteen standalone drafts: one LinkedIn post and one X post aligned to each blog in [BLOGS.md](BLOGS.md). Adjust voice, links, and any personal details before publishing. No unverified user counts or outcome claims are included.

## Set 1 — Solo builder, deployed product

**Topic:** Building DevCraft alone with a laptop and agents; what deployment does and does not prove.

**LinkedIn**

For a long time, the whole team behind DevCraft was me, my laptop, and AI agents.

I have now deployed both the web app and API. That feels significant—and it is. The product has frontend and backend learning tracks, runnable lessons, AI assistance, projects, interview practice, community features, and more.

But deployed does not mean finished. It does not mean every integration has been tested against real traffic, or that the learning experience has been proven with a wide range of learners.

The next stage is different from the last one: watch people use it, find where they get stuck, validate the real service paths, and improve what matters.

I’m starting to share the process because building in private made a lot of important work invisible. This is the beginning of that conversation.

What helped you move from “it runs” to “someone can rely on it”?

**X**

I built DevCraft alone with a laptop and AI agents. The web app and API are now deployed.

That’s a milestone, not a finish line. Next: real learner feedback, integration validation, and fixing the places where the experience breaks.

I’m opening up the build process from here.

## Set 2 — Learning by running code

**Topic:** Why DevCraft lessons center on executable practice and feedback.

**LinkedIn**

Reading about a programming concept and applying it in a blank editor are two different skills.

That gap is why DevCraft puts runnable practice at the center of its lessons. Learners work in an editor, run code against checks, and can ask for a hint or error explanation.

The challenge is that the exercise itself has to be designed well. The checks must reward a working solution without giving the answer away. Starter code should make the first step approachable, but not do the thinking for the learner.

Automated checks help us catch mechanical problems. They can’t tell us whether a beginner understands the task or feels confident enough to keep going. That requires real learner feedback.

What makes a coding exercise feel like practice instead of an answer key?

**X**

“Run code” is a teaching decision as much as an engineering feature.

The checks need to distinguish understanding from copying. The starter should invite a first step without doing the work.

That’s the practice loop we’re building into DevCraft lessons.

## Set 3 — AI that helps without taking over

**Topic:** Keeping the learner in control of the work when adding AI tutoring.

**LinkedIn**

An AI tutor that writes the whole solution may feel helpful in the moment—and leave the learner with less practice.

In DevCraft, AI assistance is meant to support the next step: hints, error explanations, code review, and interview feedback. The learner should still do the reasoning.

That principle brings hard questions: Is the hint too revealing? Is the explanation at the right level? Is the model accurate? Does it help someone become more capable afterward?

“We added AI” is not the finish line. The quality of the learning interaction is what matters, and we need to keep observing how real learners use it.

What kind of AI help leaves you more capable after the interaction?

**X**

An AI tutor should increase the learner’s agency.

Give a nudge. Explain the error. Review the code. Leave the learner responsible for the next move.

That’s the balance I’m trying to build into DevCraft.

## Set 4 — Security behind the Run button

**Topic:** What safe code execution and backend security require.

**LinkedIn**

A “Run code” button is a promise that experimentation won’t put the rest of the platform at risk.

Submitted programs are untrusted input. They can use too much CPU, consume memory, or attempt network access. So execution needs isolation and limits. Around that, the API also needs validation, rate limits, safe database queries, careful session handling, and clear failure states.

The learner sees an editor and a result. Behind that result is a set of boundaries that make practice possible.

This is part of building an education product that teaches engineering: the platform itself has to meet the standards it asks learners to apply.

What reliability feature do you think about only when it fails?

**X**

The “Run” button hides a serious promise: learner code can fail without taking the platform with it.

Execution limits, isolation, request validation, and useful error states are part of the learning experience—even when nobody sees them.

## Set 5 — Curriculum as product design

**Topic:** Progression, content tooling, and maintaining a coherent path from foundations to applied work.

**LinkedIn**

A curriculum is not a folder of articles. It is a sequence of decisions about what a learner should be able to do next.

DevCraft organizes frontend and backend topics into learning tracks, modules, and lessons with runnable exercises. But adding content is only one part of curriculum design. The transitions matter: does a lesson rely on knowledge the learner has already built? Does the next exercise ask them to apply the idea in a meaningful way?

As the content grows, authoring tools and automated checks help keep code samples readable and executable in the target environment. They catch many mistakes, but they cannot tell us whether the path makes sense to a learner.

What made a technical learning path feel coherent to you?

**X**

A curriculum isn’t a list of topics. It’s a path between “I’ve seen this idea” and “I can use it on my own.”

We’re building DevCraft around that transition: lessons, runnable practice, then larger projects.

## Set 6 — Deploying web and API together

**Topic:** Cross-repository contracts and the difference between a live service and a proven user journey.

**LinkedIn**

DevCraft has two repositories and two jobs: the web app presents the learning experience; the API owns the rules, data, and integrations.

Deploying both is a milestone. Making them behave like one product takes end-to-end work: browser configuration, authentication, API contracts, database state, email links, and external services all need to agree.

A health check can prove that a process is up. It cannot prove that verification email arrives, code execution works with the real provider, or a learner can complete a lesson and find their progress later.

I’ve deployed both halves. Now I’m working through the full user journeys that make the product trustworthy.

What end-to-end flow do you always verify after deployment?

**X**

DevCraft’s web app is deployed. Its API is deployed too.

The next test is whether one real learner journey works across both: sign up, open a lesson, run code, save progress, and come back to it.

“Service is up” and “product works” are different checks.

## Set 7 — Shipping versus learning

**Topic:** Moving from implementation milestones toward learner evidence and iteration.

**LinkedIn**

“Deployed” is a milestone. “Useful to learners” is an outcome I still need to earn.

DevCraft now has frontend and backend tracks, runnable lessons, AI assistance, projects, interview practice, community features, a playground, and admin tools. The web app and API are live, and I’m proud of how far the product has come.

The next questions can’t be answered by adding another route:

- Where does a learner pause?
- Which explanation fails to make the idea click?
- Does the AI hint help them take their own next step?
- Can someone return to the work they started?

I’m shifting toward a tighter loop: invite people in, observe, listen, and prioritize based on what they need. Building in public should help the product learn from more than its builder.

If you’re learning frontend or backend engineering, where do you most often get stuck between understanding an idea and applying it?

**X**

DevCraft is deployed. The next milestone isn’t a bigger announcement; it’s learning where real learners get stuck and fixing those points.

“Useful to learners” is the outcome I still need to earn.
