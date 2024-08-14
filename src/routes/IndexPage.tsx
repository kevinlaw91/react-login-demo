import { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { UserSessionContext } from '@/contexts/UserSessionContext';

export default function IndexPage() {
  const navigate = useNavigate();
  const { activeUser, avatarSrc } = useContext(UserSessionContext);

  useEffect(() => {
    // Redirect to sign in form if not signed in
    if (!activeUser) navigate('/signin', { replace: true });
  }, [activeUser, navigate]);

  return (
    <>
      <Helmet>
        <title>{`Welcome, ${activeUser?.id}`}</title>
      </Helmet>
      <section>
        { avatarSrc && <img src={avatarSrc} alt="Profile picture" className="size-8 rounded-full" /> }
      </section>
    </>
  );
}
