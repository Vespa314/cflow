import BlockLatex from "./BlockLatex";
import Blockquote from "./Blockquote";
import Bold from "./Bold";
import BoldEmphasis from "./BoldEmphasis";
import Br from "./Br";
import CodeBlock from "./CodeBlock";
import DoneList from "./DoneList";
import Emphasis from "./Emphasis";
import Heading from "./Heading";
import Highlight from "./Highlight";
import HorizontalRules from "./HorizontalRules";
import Image from "./Image";
import Disclosure from "./Disclosure";
import InlineCode from "./InlineCode";
import InlineLatex from "./InlineLatex";
import Link from "./Link";
import OrderedList from "./OrderedList";
import Paragraph from "./Paragraph";
import PlainLink from "./PlainLink";
import PlainText from "./PlainText";
import Spoiler from "./Spoiler";
import Strikethrough from "./Strikethrough";
import Table from "./Table";
import Tag from "./Tag";
import TodoList from "./TodoList";
import UnorderedList from "./UnorderedList";
import Sub from "./Sub";
import Sup from "./Sup";


export { TAG_REG } from "./Tag";
export { LINK_REG } from "./Link";
export { PLAIN_LINK_REG } from "./PlainLink";

export const blockElementParserList = [
  BlockLatex,
  Br,
  CodeBlock,
  Disclosure,
  Table,
  Blockquote,
  Table,
  Heading,
  TodoList,
  DoneList,
  OrderedList,
  UnorderedList,
  HorizontalRules,
  Paragraph,
];

export const inlineElementParserList = [
  InlineLatex,
  Image,
  BoldEmphasis,
  Bold,
  Spoiler,
  Emphasis,
  Link,
  InlineCode,
  Sub,
  Sup,
  Highlight,
  PlainLink,
  Strikethrough,
  Tag,
  PlainText,
];
