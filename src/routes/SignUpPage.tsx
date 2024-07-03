import { useCallback, useContext, useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon } from '@iconify-icon/react';
import { Helmet } from 'react-helmet-async';
import AuthSignUpForm from '@/components/AuthSignUpForm.tsx';
import BusyScreen from '@/components/BusyScreen.tsx';
import AuthContext, { AuthenticatedUser } from '@/context/AuthContext.tsx';
import AlertModal from '@/components/AlertModal.tsx';

export default function SignUpPage() {
  const navigate = useNavigate();
  const { activeUser, setActiveUser } = useContext(AuthContext);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [alertModalMessage, setAlertModalMessage] = useState<string | undefined>();

  useEffect(() => {
    // If already signed in, redirect to home
    if (activeUser) {
      navigate('/', { replace: true });
    }
  }, [activeUser, navigate]);

  const onFormSignUpSubmit = () => {
    setIsModalOpen(true);
    setIsSubmitting(true);
  };

  const onFormSignUpSuccess = useCallback((user: AuthenticatedUser) => {
    setIsModalOpen(false);
    setIsSubmitting(false);

    // Change app's state to signed in
    setActiveUser({ id: user.id });

    // Go to home page
    navigate('/', { replace: true });
  }, [setActiveUser, navigate]);

  const onFormSignUpError = (err?: string) => {
    setIsModalOpen(true);
    setIsSubmitting(false);
    setIsAlertModalOpen(true);
    setAlertModalMessage(err || 'Sign up failed');
  };

  const handleAlertModalDismiss = () => {
    setIsModalOpen(false);
    setIsAlertModalOpen(false);
  };

  return (
    <>
      <Helmet>
        <title>Sign Up</title>
      </Helmet>
      <div className="flex justify-center min-h-svh min-w-full lg:px-0 md:px-12 isolate">
        <div className="relative z-10 flex flex-col flex-1 px-4 py-6 bg-white lg:border-r lg:py-12 md:flex-none md:px-28 sm:justify-center">
          <div className="w-full max-w-md mx-auto md:max-w-sm md:px-0 md:w-96 sm:px-4">
            <div className="flex flex-col">
              <img
                src="assets/svg/logo.svg"
                alt="Logo"
                className="w-32 h-32 mx-auto my-6"
              />
            </div>
            <div className="text-sm text-neutral-600 text-center mb-4">
              <h1 className="text-2xl font-bold">Sign Up</h1>
              <div className="mt-4">
                <span>Already have an account? </span>
                <Link to="/signin" className="text-secondary-700 font-medium hover:underline">Sign in</Link>
              </div>
            </div>
            <AuthSignUpForm
              onSubmit={onFormSignUpSubmit}
              onSuccess={onFormSignUpSuccess}
              onError={onFormSignUpError}
            />
            <div>
              <div className="relative py-3">
                <div
                  className="absolute inset-0 flex items-center"
                  aria-hidden="true"
                >
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-2 text-sm text-neutral-400 bg-white">or</span>
                </div>
              </div>
              <button
                type="button"
                className="inline-flex items-center justify-center w-full h-12 gap-3 px-5 py-3 font-medium text-neutral-600 outline-0 bg-gray-100 rounded-xl hover:bg-gray-200 focus:ring-2 ring-primary ring-offset-2 duration-150"
                aria-label="Sign in with Google"
              >
                <img src="/assets/svg/logo-google.svg" height="24" width="24" alt="Google logo" />
                <span>Sign up with Google</span>
              </button>
            </div>
          </div>
        </div>
        <div className="hidden lg:block lg:flex-1 lg:relative sm:contents">
          <div className="absolute w-full h-full">
            <img
              className="object-cover w-full h-full"
              src="assets/images/pawel-czerwinski-Zd315A95aqg-unsplash.webp"
              alt=""
            />
          </div>
        </div>
      </div>
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ backdropFilter: 'blur(0px)', opacity: 0 }}
            animate={{ backdropFilter: 'blur(10px)', opacity: 1 }}
            exit={{ backdropFilter: 'blur(0px)', opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 bg-black/60"
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isSubmitting && <BusyScreen message="Creating account" />}
      </AnimatePresence>
      <AnimatePresence>
        {isAlertModalOpen && (
          <AlertModal
            icon={<Icon icon="ion:warning" height={36} style={{ color: '#ffa58a' }} />}
            message={alertModalMessage}
            dismiss={handleAlertModalDismiss}
          />
        )}
      </AnimatePresence>
    </>
  );
}
