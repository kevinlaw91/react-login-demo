import { useCallback, useRef, useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { arrow, autoUpdate, flip, FloatingArrow, FloatingPortal, offset, shift, useDismiss, useFloating, useFocus, useHover, useInteractions, useRole } from '@floating-ui/react';
import { Link } from 'react-router-dom';
import fetchMock from 'fetch-mock';
import { z } from 'zod';
import { Icon } from '@iconify-icon/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { createUser, ERR_UNEXPECTED_ERROR, ERR_SIGNUP_REJECTED } from '@/services/auth.ts';
import { AuthenticatedUser } from '@/context/AuthContext.tsx';
import FormErrorMessage from '@/components/FormErrorMessage.tsx';

/* ===== Types/Schemas ===== */
const signUpSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string()
    .min(8, { message: 'Password must be at least 8 characters long' })
    .regex(/^[a-zA-Z0-9 !@#$%^&*()\-_+=[\]{}|\\;:'",.<>/?]*$/, { message: 'Can only contains letters, numbers, spaces and symbols' }),
});

type SignUpFormData = z.infer<typeof signUpSchema>;

export interface SignUpSuccessResponse {
  success: true;
  data: { id: string };
}

export interface SignUpFailureResponse {
  success: false;
  message?: string;
}

export type SignUpResponse = SignUpSuccessResponse | SignUpFailureResponse;

/* ===== Constants ===== */
const MSG_ERR_GENERIC = 'Unable to create account. Please try again later';
const MSG_ERR_REJECTED = 'This email and password combination cannot be used';

/* ===== Mock data ===== */
const responseSuccess: SignUpSuccessResponse = { success: true, data: { id: '1234' } };
const responseErrorSignUpRejected: SignUpFailureResponse = { success: false, message: ERR_SIGNUP_REJECTED };

export default function AuthSignUpForm(props: {
  onSubmit: () => void;
  onSuccess: (user: AuthenticatedUser) => void;
  onError: (err?: string) => void;
}) {
  /* ===== Form controller ===== */
  const {
    register,
    handleSubmit,
    trigger,
    setError,
    getFieldState,
    formState: { errors },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
  });
  const [userWarnedUntrimmedPassword, setUserWarnedUntrimmedPassword] = useState(false);
  const passwordFieldState = getFieldState('password');

  /* ===== Password tooltip controller ===== */
  const [isPasswordTooltipVisible, setIsPasswordTooltipVisible] = useState(false);
  const tooltipPasswordArrowRef = useRef<SVGSVGElement | null>(null);
  const { refs, floatingStyles, context } = useFloating({
    open: isPasswordTooltipVisible,
    onOpenChange: setIsPasswordTooltipVisible,
    placement: 'top',
    // Make sure the tooltip stays on the screen
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(6),
      flip({
        fallbackAxisSideDirection: 'end',
      }),
      shift(),
      arrow({
        element: tooltipPasswordArrowRef,
      }),
    ],
  });
  const { getReferenceProps, getFloatingProps } = useInteractions([
    useHover(context, { move: false }),
    useFocus(context),
    useDismiss(context),
    useRole(context, { role: 'tooltip' }),
  ]);

  /* ===== Password field masking controller ===== */
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const togglePasswordVisibility = () => setIsPasswordVisible(!isPasswordVisible);

  /* ===== Responsive password validation ===== */
  const handlePasswordFieldChange = useCallback(
    () => void trigger('password'),
    [trigger],
  );

  const { onSubmit: onSubmitCallback, onSuccess: onSuccessCallback, onError: onErrorCallback } = props;

  const formSignUpSubmitHandler: SubmitHandler<SignUpFormData> = useCallback(
    (data: SignUpFormData) => {
      // Mask the password field during form submission
      setIsPasswordVisible(false);

      // Warn once if password field has leading or trailing spaces
      if (!userWarnedUntrimmedPassword && data.password !== data.password.trim()) {
        setUserWarnedUntrimmedPassword(true);
        onErrorCallback('Your password may contain leading or trailing spaces\nResubmit if you\'re certain you want to proceed');
        return;
      }

      // Tell the parent page form is submitting
      onSubmitCallback();

      // Mock API
      if (data.email !== 'registered@example.com') {
        fetchMock.post('path:/api/account/create',
          {
            status: 200,
            body: responseSuccess,
            headers: {
              'Content-Type': 'application/json',
            },
          },
          { delay: 1000 },
        );
      } else {
        fetchMock.post('path:/api/account/create',
          {
            status: 403,
            body: responseErrorSignUpRejected,
            headers: {
              'Content-Type': 'application/json',
            },
          },
          { delay: 1000 },
        );
      }

      createUser(data)
        .then((res: SignUpResponse) => {
          if (res.success) {
            // Success, tell the parent component login success
            onSuccessCallback({ id: res.data.id });
            return;
          }
          // Malformed response?
          throw new Error(ERR_UNEXPECTED_ERROR);
        })
        .catch((err) => {
          // Error: Unable to create user account
          if (err instanceof Error) {
            if (err.message && err.message === ERR_SIGNUP_REJECTED) {
              setError('root', { type: 'api', message: MSG_ERR_REJECTED });
              onErrorCallback(MSG_ERR_REJECTED);
            } else {
              setError('root', { type: 'api', message: MSG_ERR_GENERIC });
              onErrorCallback(MSG_ERR_GENERIC);
            }
          } else {
            setError('root', { type: 'api', message: MSG_ERR_GENERIC });
            onErrorCallback(MSG_ERR_GENERIC);
          }
        });

      // Restore fetch mock
      fetchMock.restore();
    },
    [userWarnedUntrimmedPassword, onSubmitCallback, onErrorCallback, onSuccessCallback, setError],
  );

  return (
    <form onSubmit={handleSubmit(formSignUpSubmitHandler)}>
      <div className="space-y-3">
        <div>
          <label
            htmlFor="email"
            className="block mb-3 text-sm font-medium text-neutral-600"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            maxLength={254}
            placeholder="Your name"
            className="block w-full h-12 px-4 py-2 text-neutral-800 border rounded-lg appearance-none bg-chalk border-zinc-300 placeholder-zinc-300 focus:border-primary-200 outline-none ring-primary-300 sm:text-sm transition duration-150"
            {...register('email', { setValueAs: (value: string) => value.trim() })}
          />
          {errors?.email && (
            <FormErrorMessage>{errors?.email?.message}</FormErrorMessage>
          )}
        </div>
        <div className="col-span-full">
          <label
            htmlFor="password"
            className="block mb-3 text-sm font-medium text-neutral-600"
          >
            <span>Password</span>
            {
              passwordFieldState.isDirty
                ? <Icon ref={refs.setReference} {...getReferenceProps()} icon={passwordFieldState.invalid ? 'mi:circle-error' : 'codicon:pass-filled'} width="16" className={`align-text-bottom ml-2 cursor-help ${passwordFieldState.invalid ? 'text-red-800/60' : 'text-[#008194]'}`} />
                : <Icon ref={refs.setReference} {...getReferenceProps()} icon="material-symbols:info-outline" width="16" className="text-neutral-400 align-text-bottom ml-2 cursor-help" />
            }
          </label>
          <FloatingPortal>
            {isPasswordTooltipVisible && (
              <div
                className="bg-[#222] rounded-lg px-4 py-4 shadow-lg"
                ref={refs.setFloating}
                style={floatingStyles}
                {...getFloatingProps()}
              >
                <div className="text-sm text-neutral-400">
                  {
                    passwordFieldState.isDirty && !passwordFieldState.invalid
                      ? (
                          <div>Your password is ok.</div>
                        )
                      : (
                          <div>
                            Password
                            <span className="font-bold"> MUST </span>
                            be at least 8 characters long.
                          </div>
                        )
                  }
                  <section className="mt-2 pt-2 opacity-50 border-t border-neutral-600">
                    <div className="font-bold">(Optional)</div>
                    <h3>Strong password:</h3>
                    <p>Use a mix of uppercase, lowercase, numbers, and symbols.</p>
                    <p>Use a longer password.</p>
                  </section>
                </div>
                <FloatingArrow
                  ref={tooltipPasswordArrowRef}
                  context={context}
                  tipRadius={3}
                  className="fill-[#222]"
                />
              </div>
            )}
          </FloatingPortal>
          <div className="relative flex items-center">
            <input
              className="block w-full h-12 px-4 py-2 pr-12 text-neutral-800 border rounded-lg appearance-none bg-chalk border-zinc-300 placeholder-zinc-300 focus:border-primary-200 outline-none ring-primary-300 sm:text-sm transition duration-150"
              placeholder="At least 8 characters"
              id="password"
              maxLength={255}
              type={isPasswordVisible ? 'text' : 'password'}
              {...register('password', { onChange: handlePasswordFieldChange })}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 rounded-lg focus:outline-none focus:ring-1 ring-primary-200"
              onClick={togglePasswordVisibility}
              title={isPasswordVisible ? 'Hide password' : 'Show password'}
              aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
              aria-pressed={isPasswordVisible}
            >
              <Icon icon={isPasswordVisible ? 'basil:eye-outline' : 'basil:eye-closed-outline'} width="24" className="text-neutral-400 align-middle p-1" />
            </button>
          </div>
          {errors.password && (
            <FormErrorMessage>{errors?.password?.message}</FormErrorMessage>
          )}
        </div>
        <div className="text-xs text-neutral-600 text-center py-1">
          <span>By clicking &quot;Create Account&quot; you agree to our </span>
          <div>
            <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link>
            <span> and </span>
            <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
          </div>
        </div>
        <div className="col-span-full">
          <button
            type="submit"
            className="w-full h-12 gap-3 px-5 py-3 font-medium text-white bg-primary hover:bg-primary-500 outline-none rounded-xl focus:ring-2 ring-offset-2 ring-primary transition duration-150"
          >
            Create Account
          </button>
        </div>
        {errors?.root && (
          <FormErrorMessage icon={<Icon icon="ion:warning" inline width="24" className="align-bottom mr-1" />}>
            {errors?.root?.message}
          </FormErrorMessage>
        )}
      </div>
    </form>
  );
}