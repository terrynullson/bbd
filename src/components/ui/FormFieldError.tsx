type FormFieldErrorProps = {
  children: React.ReactNode;
  id?: string;
};

export function FormFieldError({ children, id }: FormFieldErrorProps) {
  return (
    <p id={id} role="alert" className="mt-1.5 text-xs leading-relaxed text-expired">
      {children}
    </p>
  );
}
