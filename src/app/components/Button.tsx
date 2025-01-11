const Button = ({
  disabled,
  children,
  onClick,
}: {
  disabled?: boolean;
  onClick: (e?: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  children: React.ReactNode;
}) => {
  return (
    <button
      disabled={disabled}
      className="border-2 mt-4 bg-amber-300 disabled:bg-gray-300 rounded-[10px] w-[80px]"
      onClick={onClick}
    >
      {children}
    </button>
  );
};
