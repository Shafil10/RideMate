# Chatbot Accuracy Comparison — Rule-Based vs. Real LLM (Groq)

Ran 17 fixed FAQ test cases through both engines.

## Summary

| Engine | Correct | Total scored | Accuracy |
|---|---|---|---|
| Rule-based (keyword matching) | 17 | 17 | 100% |
| Real LLM (Groq / Llama 3.3 70B) | 14 | 14 (3 off-topic cases need manual read) | 100% |

**Grading method:** rule-based is graded by exact topic-ID match (deterministic — it's keyword lookup). The LLM is freeform text, so it's graded by a keyword-presence heuristic per topic (did the reply mention the facts a correct answer should contain) — this is a proxy for correctness, not true semantic grading. Off-topic guardrail cases are left for manual review since "did it politely redirect vs. actually answer the unrelated question" isn't reliably checkable by keyword matching.

## Per-question results

### "How do I create a ride?"

Expected topic: `create-ride`

**Rule-based** (topic: `create-ride`, ✅ correct):
> To create a ride, tap 'Create Ride' in the navbar, then fill in your route, departure time, seats available, and fare per seat. Your ride goes live immediately for students on your route.

**AI (Groq)** (✅ on-topic):
> To create a ride, just tap 'Create Ride' in the navbar, then fill in your route, departure time, the number of seats you have available, and the fare per seat. You can choose to use our suggested fare or set your own fixed price. Once you've filled in all the details, you're good to go and other students can start joining your ride.

---

### "I want to post a ride as a driver, how does that work?"

Expected topic: `create-ride`

**Rule-based** (topic: `create-ride`, ✅ correct):
> To create a ride, tap 'Create Ride' in the navbar, then fill in your route, departure time, seats available, and fare per seat. Your ride goes live immediately for students on your route.

**AI (Groq)** (✅ on-topic):
> To create a ride as a driver, just tap 'Create Ride' in the navbar, then fill in your route, departure time, how many seats you have available, and the fare per seat. You can choose to use our suggested fare or override it with your own fixed price. Once you've filled in all the details, just submit it and your ride will be live for other students to join.

---

### "How can I join a ride?"

Expected topic: `join-ride`

**Rule-based** (topic: `join-ride`, ✅ correct):
> Head to the Rides page to browse available rides filtered by university and route. Tap 'Join' on any ride with open seats to reserve your spot.

**AI (Groq)** (✅ on-topic):
> To join a ride, simply browse the Rides page in the app, filter by your university or route to find a ride that fits your needs, and then tap 'Join' on a ride that has open seats. Make sure to check the details like departure time and fare before joining. If you have any issues or need help with filtering, I'm here to assist you.

---

### "Where do I search for available rides?"

Expected topic: `join-ride`

**Rule-based** (topic: `join-ride`, ✅ correct):
> Head to the Rides page to browse available rides filtered by university and route. Tap 'Join' on any ride with open seats to reserve your spot.

**AI (Groq)** (✅ on-topic):
> You can find available rides on the Rides page in the RideMate app, where you can browse and filter by university or route to find a ride that suits you. Just tap on the ride you're interested in to see more details, and if there are open seats, you can join by tapping the 'Join' button. If you need help with filtering or have any other questions, feel free to ask.

---

### "How much does a ride cost?"

Expected topic: `fare`

**Rule-based** (topic: `fare`, ✅ correct):
> Fares are split evenly between the driver and all riders based on the ride type (Shared Taxi Ride or Student Driver Ride). You'll see the exact per-seat fare before joining.

**AI (Groq)** (✅ on-topic):
> The cost of a ride on RideMate is calculated based on a base fare, a per-km rate, and rush-hour pricing, which applies during typical Dhaka commute windows. If you're joining a Student Driver ride, the total fare splits evenly across all available seats. You can also see the fare per seat when creating or joining a ride, and some drivers may override the calculated fare with their own fixed price.

---

### "How is the fare split between riders?"

Expected topic: `fare`

**Rule-based** (topic: `fare`, ✅ correct):
> Fares are split evenly between the driver and all riders based on the ride type (Shared Taxi Ride or Student Driver Ride). You'll see the exact per-seat fare before joining.

**AI (Groq)** (✅ on-topic):
> For Student Driver rides on RideMate, the total fare is split evenly across all available seats, so you'll only pay your share of the total cost. If the driver sets a fixed price, that will apply instead, but normally the fare is divided up among the riders. This way, it's fair and affordable for everyone in the ride.

---

### "Is RideMate safe to use?"

Expected topic: `safety`

**Rule-based** (topic: `safety`, ✅ correct):
> All drivers and riders are verified with a university email, and every profile carries a trust score built from past ride ratings. Report any safety concern from the ride detail page.

**AI (Groq)** (✅ on-topic):
> RideMate is designed with safety in mind, we verify all drivers and riders through their university email, and our reliability score and rating system helps build trust within the community. You can also report any safety concerns from the ride detail page. Plus, our AI features like geographic route matching and smart pickup-point suggestions help make your rides smoother and more secure.

---

### "How do you verify drivers are trustworthy?"

Expected topic: `safety`

**Rule-based** (topic: `safety`, ✅ correct):
> All drivers and riders are verified with a university email, and every profile carries a trust score built from past ride ratings. Report any safety concern from the ride detail page.

**AI (Groq)** (✅ on-topic):
> We verify drivers and riders through their university email, which helps ensure that only students from our supported universities are using the platform. Additionally, each profile has a reliability score and rating that's built from real feedback after each ride, so you can get an idea of a driver's trustworthiness before joining a ride. You can also report any safety concerns from the ride detail page if you have any issues.

---

### "What AI features does RideMate have?"

Expected topic: `ai-features`

**Rule-based** (topic: `ai-features`, ✅ correct):
> RideMate's AI features are live: geographic route matching, fair fare calculation (with rush-hour pricing), reliability scores from real ratings, smart pickup-point suggestions, and recurring-ride detection. Trust & safety enhancements are next on the roadmap.

**AI (Groq)** (✅ on-topic):
> RideMate has several AI features that make your ride-sharing experience smoother. These include geographic route matching for recommendations, fair fare calculation that takes rush hours into account, reliability scores based on real ratings, smart pickup-point suggestions from your ride history, and recurring-ride detection that spots your regular commutes. We're also working on some trust and safety UI enhancements that will be rolled out soon.

---

### "Do you have smart pickup suggestions?"

Expected topic: `ai-features`

**Rule-based** (topic: `ai-features`, ✅ correct):
> RideMate's AI features are live: geographic route matching, fair fare calculation (with rush-hour pricing), reliability scores from real ratings, smart pickup-point suggestions, and recurring-ride detection. Trust & safety enhancements are next on the roadmap.

**AI (Groq)** (✅ on-topic):
> Yes, RideMate has a feature that suggests smart pickup points based on your ride history, making it easier for you to find a convenient spot to get picked up. This feature uses our AI technology to learn your frequent pickup locations and recommend them to you when creating or joining a ride. It's one of the many ways we're using AI to make your ride-sharing experience more seamless and efficient.

---

### "Which universities are supported?"

Expected topic: `universities`

**Rule-based** (topic: `universities`, ✅ correct):
> RideMate currently supports 40+ universities across Bangladesh including BUET, NSU, AIUB, DU, and more. Your university is matched automatically from your student email.

**AI (Groq)** (✅ on-topic):
> RideMate supports over 40 universities across Bangladesh, including popular ones like BUET, NSU, AIUB, and DU. When you sign up, your university is automatically matched from your student email, making it easy to find rides with fellow students. If you're unsure about your university's support, feel free to ask and I can help you check.

---

### "Is my university on RideMate?"

Expected topic: `universities`

**Rule-based** (topic: `universities`, ✅ correct):
> RideMate currently supports 40+ universities across Bangladesh including BUET, NSU, AIUB, DU, and more. Your university is matched automatically from your student email.

**AI (Groq)** (✅ on-topic):
> We support over 40 universities across Bangladesh, including popular ones like BUET, NSU, AIUB, and DU. When you sign up, we automatically match your university based on your student email, so try signing in to see if yours is on the list. If you're still unsure, feel free to ask and I can help you check.

---

### "Can I talk to a human about a problem?"

Expected topic: `human-support`

**Rule-based** (topic: `human-support`, ✅ correct):
> I'll flag this for our support team to follow up by email. In the meantime, feel free to ask me about creating rides, joining rides, fares, or safety.

**AI (Groq)** (✅ on-topic):
> I'll flag this for our support team to follow up with you by email, so they can help you with your issue. In the meantime, I'm here to help answer any questions you have about using RideMate, from creating rides to safety features. Would you like some help with something specific in the app?

---

### "I need to contact support directly"

Expected topic: `human-support`

**Rule-based** (topic: `human-support`, ✅ correct):
> I'll flag this for our support team to follow up by email. In the meantime, feel free to ask me about creating rides, joining rides, fares, or safety.

**AI (Groq)** (✅ on-topic):
> I'll flag this for our support team to follow up with you by email. In the meantime, I'm here to help with any RideMate-related questions you might have, such as creating a ride, joining a ride, or understanding our safety features. Is there anything specific about RideMate you'd like to know?

---

### "What's the weather like in Dhaka today?"

Expected topic: `fallback`

**Rule-based** (topic: `fallback`, ✅ correct):
> I'm not sure about that one yet — I can help with creating rides, joining rides, fares, safety, or supported universities. You can also ask to talk to a human agent.

**AI (Groq)** (⚠️ manual review):
> I'm here to help with RideMate related questions, so let's focus on getting you around the city safely and efficiently. If you're planning a ride, I can help with creating or joining one, or answer any questions about fares, safety, or our supported universities. What's on your mind about RideMate?

---

### "Can you help me solve a calculus integral?"

Expected topic: `fallback`

**Rule-based** (topic: `fallback`, ✅ correct):
> I'm not sure about that one yet — I can help with creating rides, joining rides, fares, safety, or supported universities. You can also ask to talk to a human agent.

**AI (Groq)** (⚠️ manual review):
> I'm here to help with RideMate, the university student ride-sharing platform. I can assist with creating rides, joining rides, fares, safety, and more, but I'm not equipped to help with calculus or other academic subjects. If you have any RideMate-related questions, I'd be happy to help, though.

---

### "What time does the sun set today?"

Expected topic: `fallback`

**Rule-based** (topic: `fallback`, ✅ correct):
> I'm not sure about that one yet — I can help with creating rides, joining rides, fares, safety, or supported universities. You can also ask to talk to a human agent.

**AI (Groq)** (⚠️ manual review):
> I'm not able to provide information about the sunset time, as that's outside of RideMate's scope. I can help you with creating rides, joining rides, fares, safety, or anything else related to the RideMate app, though. Would you like to know how to create a ride or find a ride to your university?

---

