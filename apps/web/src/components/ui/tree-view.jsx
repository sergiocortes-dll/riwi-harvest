import { createElement } from "@harvest/core";

const TreeItem = ({
  label,
  children,
  component,
  componentProps = {},
  icon,
  onClick,
}) => {
  // Función para renderizar el contenido del label con componente personalizado
  const renderLabelContent = () => {
    const content = [
      // Icono opcional
      icon &&
        createElement("i", {
          className: `${icon} mr-2`,
        }),
      // Label text
      label,
    ].filter(Boolean);

    if (component) {
      // Si hay un componente personalizado, lo usamos
      return createElement(
        component,
        {
          ...componentProps,
          className: `${componentProps.className || ""} flex items-center`,
          onClick: onClick || componentProps.onClick,
        },
        ...content
      );
    }

    // Si no hay componente personalizado, usamos un div/span simple
    return content;
  };

  return createElement(
    "li",
    { className: "list-none" },
    children
      ? createElement(
          "details",
          {
            className: "cursor-pointer tree-details",
            open:
              componentProps.defaultOpen !== undefined
                ? componentProps.defaultOpen
                : true,
          },
          createElement(
            "summary",
            {
              className: `
                p-2
                select-none
                transition-all duration-200 ease-in-out
                hover:bg-slate-100
                focus:bg-slate-100
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
                text-slate-700
                font-medium
                flex items-center
                relative
                tree-summary
              `
                .replace(/\s+/g, " ")
                .trim(),
              onClick: onClick,
            },
            createElement("i", {
              className:
                "fas fa-chevron-right mr-2 transition-transform duration-200 tree-chevron",
            }),
            renderLabelContent()
          ),
          createElement(
            "ul",
            {
              className: `
                ml-4 pl-3
                border-l-2 border-divider
                animate-in slide-in-from-top-1 duration-200
              `
                .replace(/\s+/g, " ")
                .trim(),
            },
            children
          )
        )
      : createElement(
          "div",
          {
            className: `
              block
              transition-all duration-200
              ml-2
              relative
              before:content-['']
              before:absolute
              before:-left-3
              before:text-slate-400
              hover:bg-slate-100
              text-slate-500
              hover:text-slate-900
            `
              .replace(/\s+/g, " ")
              .trim(),
            onClick: onClick,
          },
          component
            ? createElement(
                component,
                {
                  ...componentProps,
                  className: `${
                    componentProps.className || ""
                  } p-2 flex items-center`,
                  onClick: onClick || componentProps.onClick,
                },
                icon && createElement("i", { className: `${icon} mr-2` }),
                label
              )
            : [
                icon &&
                  createElement("i", {
                    className: `${icon} mr-2`,
                  }),
                createElement(
                  "span",
                  {
                    className: "block p-2",
                  },
                  label
                ),
              ].filter(Boolean)
        )
  );
};

const TreeView = ({ data, className = "" }) => {
  const renderTree = (nodes) =>
    nodes.map((node, idx) =>
      createElement(
        TreeItem,
        {
          key: node.key || idx,
          label: node.label,
          component: node.component,
          componentProps: node.componentProps,
          icon: node.icon,
          onClick: node.onClick,
        },
        node.children ? renderTree(node.children) : null
      )
    );

  return createElement(
    "div",
    {
      className: `
        ${className}
      `
        .replace(/\s+/g, " ")
        .trim(),
    },
    createElement(
      "style",
      {},
      `
      .tree-details[open] > .tree-summary > .tree-chevron {
        transform: rotate(90deg);
      }
      .tree-details:not([open]) > .tree-summary > .tree-chevron {
        transform: rotate(0deg);
      }
    `
    ),
    createElement(
      "ul",
      {
        className: `
          text-sm
          space-y-1
          font-sans
        `
          .replace(/\s+/g, " ")
          .trim(),
      },
      renderTree(data)
    )
  );
};

export default TreeView;
