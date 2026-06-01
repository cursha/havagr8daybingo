import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Heart } from 'lucide-react';

const TermsOfService: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
          <span className="font-black text-slate-800">Havagr8day!</span>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-6 text-slate-700">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1">HavaGr8Day Bingo Terms of Service</h1>
          <p className="text-sm text-slate-400">Last Updated: June 1, 2026</p>
        </div>

        <p>
          Welcome to HavaGr8Day Bingo. By accessing or using this website, mobile application, game,
          or related services (collectively, the "Service"), you agree to be bound by these Terms of
          Service.
        </p>
        <p>If you do not agree with these Terms, please do not use the Service.</p>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-2">1. Our Mission</h2>
          <p>
            HavaGr8Day Bingo is designed to encourage kindness, generosity, community involvement,
            gratitude, and positive interactions through a fun and engaging game experience.
          </p>
          <p className="mt-2">
            While we hope the game inspires meaningful actions and connections, participation is
            entirely voluntary and users are responsible for their own actions and decisions.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-2">2. Eligibility</h2>
          <p>
            You must be at least 18 years of age to create an account or participate without parental
            consent.
          </p>
          <p className="mt-2">
            If you are under the age of majority in your jurisdiction, you may only participate with
            the permission of a parent or legal guardian.
          </p>
          <p className="mt-2">By using the Service, you confirm that you meet these requirements.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-2">3. User Conduct</h2>
          <p className="mb-2">Users agree to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Treat others with respect and kindness.</li>
            <li>Follow all applicable laws.</li>
            <li>Respect personal boundaries and privacy.</li>
            <li>Act safely and responsibly at all times.</li>
            <li>Use good judgment when interacting with others.</li>
          </ul>
          <p className="mt-3 mb-2">Users must not:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Harass, threaten, intimidate, or discriminate against others.</li>
            <li>Engage in unsafe, illegal, or harmful activities.</li>
            <li>Misrepresent completed deeds or activities.</li>
            <li>Use the Service to promote hate, violence, scams, or illegal conduct.</li>
            <li>Interfere with the operation of the Service.</li>
          </ul>
          <p className="mt-3">
            HavaGr8Day reserves the right to suspend or terminate accounts that violate these rules.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-2">4. Good Deeds and Challenges</h2>
          <p>
            The deeds, challenges, suggestions, and activities provided through the Service are
            intended as optional ideas only.
          </p>
          <p className="mt-2">
            Users are solely responsible for determining whether a particular activity is appropriate,
            safe, legal, and suitable for their circumstances.
          </p>
          <p className="mt-2">
            If a deed involves interacting with another person, users must always respect the wishes,
            comfort level, and consent of that individual.
          </p>
          <p className="mt-2">No user is required to complete any specific deed.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-2">5. Personal Responsibility</h2>
          <p>Participation is at your own risk.</p>
          <p className="mt-2">
            HavaGr8Day Bingo does not supervise user activities and cannot guarantee outcomes from any
            interaction, challenge, or deed.
          </p>
          <p className="mt-2">
            Users accept full responsibility for their actions, decisions, interactions, travel,
            purchases, donations, or other activities undertaken in connection with the Service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-2">6. Prizes and Rewards</h2>
          <p>
            From time to time, HavaGr8Day Bingo may offer prizes, contests, rewards, promotions, or
            giveaways.
          </p>
          <p className="mt-2 mb-2">Unless otherwise stated:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>No purchase is necessary to participate.</li>
            <li>Prize availability may vary.</li>
            <li>Prizes are awarded at the sole discretion of HavaGr8Day.</li>
            <li>Prize values and availability may change without notice.</li>
            <li>HavaGr8Day reserves the right to modify, suspend, or cancel any promotion at any time.</li>
          </ul>
          <p className="mt-3">All prize decisions are final.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-2">7. User Content</h2>
          <p className="mb-2">If you submit photos, comments, stories, testimonials, or other content:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>You confirm that you own or have permission to share the content.</li>
            <li>
              You grant HavaGr8Day a non-exclusive, royalty-free, worldwide licence to display,
              publish, promote, and distribute that content in connection with the Service.
            </li>
            <li>You retain ownership of your content.</li>
          </ul>
          <p className="mt-3">
            We reserve the right to remove content that violates these Terms or is otherwise deemed
            inappropriate.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-2">8. Privacy</h2>
          <p>Your use of the Service is also governed by our Privacy Policy.</p>
          <p className="mt-2">
            By using the Service, you consent to the collection and use of information as described in
            that policy.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-2">9. No Guarantees</h2>
          <p>
            We hope HavaGr8Day Bingo creates smiles, positive experiences, and meaningful connections.
          </p>
          <p className="mt-2 mb-2">However, we make no guarantees regarding:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Personal outcomes</li>
            <li>Relationships</li>
            <li>Employment opportunities</li>
            <li>Health benefits</li>
            <li>Financial benefits</li>
            <li>Prize winnings</li>
            <li>Community impact</li>
          </ul>
          <p className="mt-3">Individual results will vary.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-2">10. Disclaimer of Warranties</h2>
          <p>The Service is provided on an "as is" and "as available" basis.</p>
          <p className="mt-2">
            To the maximum extent permitted by law, HavaGr8Day disclaims all warranties, express or
            implied, including warranties of merchantability, fitness for a particular purpose, and
            non-infringement.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-2">11. Limitation of Liability</h2>
          <p>
            To the fullest extent permitted by law, HavaGr8Day, its owners, volunteers, partners,
            affiliates, officers, employees, and representatives shall not be liable for any direct,
            indirect, incidental, special, consequential, or punitive damages arising from or related
            to:
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Use of the Service</li>
            <li>Participation in deeds or activities</li>
            <li>Interactions with other users</li>
            <li>Prize programs</li>
            <li>Technical interruptions</li>
            <li>User-generated content</li>
          </ul>
          <p className="mt-3">Your sole remedy for dissatisfaction with the Service is to stop using it.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-2">12. Changes to the Service</h2>
          <p>
            We may update, modify, suspend, or discontinue any part of the Service at any time without
            notice.
          </p>
          <p className="mt-2">
            We may also update these Terms from time to time. Continued use of the Service following
            any changes constitutes acceptance of the updated Terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-2">13. Termination</h2>
          <p>
            We reserve the right to suspend or terminate access to the Service at any time, with or
            without notice, if we believe a user has violated these Terms or acted in a manner
            inconsistent with the spirit of the community.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-2">14. Governing Law</h2>
          <p>
            These Terms shall be governed by and interpreted in accordance with the laws of the
            Province of Ontario and the laws of Canada applicable therein.
          </p>
          <p className="mt-2">
            Any disputes arising from these Terms shall be subject to the exclusive jurisdiction of
            the courts of Ontario, Canada.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-2">15. Contact Us</h2>
          <p>Questions regarding these Terms may be directed to:</p>
          <address className="mt-2 not-italic text-slate-600">
            HavaGr8Day Bingo<br />
            Ontario, Canada<br />
            <a href="https://www.havagr8day.com" className="text-indigo-600 underline underline-offset-2">
              www.havagr8day.com
            </a>
          </address>
        </section>

        <p className="pt-4 pb-8 text-slate-500 italic text-center">
          Thank you for helping make the world a little brighter, one good deed at a time.
        </p>
      </div>
    </div>
  );
};

export default TermsOfService;
