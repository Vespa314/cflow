import React, { ReactNode } from 'react';

function highlightText(
    element: string | JSX.Element,
    textQuery: string
  ): JSX.Element {
    const wrapWithColor = (text: string, target: string): ReactNode => {
      if (text.length === 0) return text;
      const regex = new RegExp(`(${target.toLowerCase()})`, 'gi');
      const parts = text.split(regex);
      return (
        <>
          {parts.map((part, index) => (
            <React.Fragment key={index}>
              {target.toLowerCase().includes(part.toLowerCase()) ? (
                <span className="text-red-500 search_match_highlight">{part}</span>
              ) : (
                part
              )}
            </React.Fragment>
          ))}
        </>
      );
    };

    const processChildren = (children: ReactNode): ReactNode => {
      if (typeof children === 'string') {
        return wrapWithColor(children, textQuery);
      } else if (React.isValidElement(children)) {
        return React.cloneElement(children, {
          ...children.props,
          children: processChildren(children.props.children),
        });
      } else if (Array.isArray(children)) {
        return children.map((child, index) => (
          <React.Fragment key={index}>{processChildren(child)}</React.Fragment>
        ));
      }
      return children;
    };

    if (typeof element === 'string') {
      return <>{wrapWithColor(element, textQuery)}</>;
    } else if (React.isValidElement(element)) {
      return React.cloneElement(element, {
        ...(element.props as any),
        children: processChildren((element as any).props.children),
      });
    }

    return <>{element}</>;
  }

export default highlightText;