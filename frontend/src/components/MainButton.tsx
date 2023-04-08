export interface MainButtonProps {
  title: string;
  onClick: () => void;
}

export default function MainButton({ title, onClick }: MainButtonProps) {
  return (
    <div>
      <button
        onClick={onClick}
        type="button"
        className="flex w-full justify-center rounded-md bg-indigo-600 py-2 px-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
      >
        {title}
      </button>
    </div>
  );
}
