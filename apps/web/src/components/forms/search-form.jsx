import Input from "@/components/ui/input";
import { createElement } from "@harvest/core";

const SearchForm = ({
  onSearch,
  placeholder = "Buscar...",
  buttonIcon = <i class="fa-solid fa-magnifying-glass"></i>,
  ...props
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    const query = new FormData(e.target).get("search");
    if (onSearch) onSearch(query);
  };

  return createElement(
    "form",
    {
      onSubmit: handleSubmit,
      className: "w-full max-w-md",
      ...props,
    },
    createElement(Input, {
      name: "search",
      placeholder,
      size: "large",
      iconLeft: <i class="fa-solid fa-magnifying-glass"></i>,
      buttonRight: {
        icon: buttonIcon,
        onClick: () => {
          const form = document.activeElement.closest("form");
          if (form) form.requestSubmit();
        },
      },
    })
  );
};

export default SearchForm;
