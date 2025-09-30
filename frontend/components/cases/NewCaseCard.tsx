export default function NewCaseCard({ onCreate }: { onCreate: () => void }) {
  return (
    <button
      onClick={onCreate}
      className="group flex w-full items-center justify-center rounded-xl border-2 border-dashed border-[#E0E0E0] dark:border-[#404040] bg-[#F8F8F8] dark:bg-[#2A2A2A] text-[#4A4A4A] dark:text-[#B0B0B0] p-8 h-[200px] transition duration-200 hover:border-dotted hover:border-[#FF7F50] dark:hover:border-[#FF7F50]"
    >
      <div className="flex flex-col items-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#FFF5F0] dark:bg-[#2A1A0F] text-[#FF7F50] border border-[#FF7F50]/20 dark:border-[#FF7F50]/30">
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
        </div>
        <div className="text-lg font-medium text-[#2A2A2A] dark:text-[#E0E0E0]">
          Create new case
        </div>
        <div className="text-sm text-[#4A4A4A] dark:text-[#B0B0B0] mt-1">
          Start a new forensic analysis
        </div>
      </div>
    </button>
  );
}
