import { matcher } from "../matcher";
import { marked } from "..";
import { inlineElementParserList } from ".";

export const TABLE_BLOCK_REG = / *(\|[^\n]+\| *)\n( *\|[\|:-\s]+\| *)((\n *\|[^\n]*\| *){1,})/;

const renderer = (rawStr: string) => {
  const matchResult = matcher(rawStr, TABLE_BLOCK_REG);
  if (!matchResult) {
    return <>{rawStr}</>;
  }
  const titles = matchResult[1].trim().split("|")
  const header_arr = titles.filter(s => s.trim().match(/\S/));

  let arr: string[][] = [];
  const const_line_reg = /^ *\|(.*)\| *$/
  for (const line of matchResult[3].split("\n")) {
    if(line.trim().length == 0) {
      continue
    }
    const match_res = line.match(const_line_reg)
    if (!match_res) {
      break
    }
    arr.push([])
    match_res[1].trim().split("|").map(v => {arr[arr.length - 1].push(v.trim())})
  }

  if (arr.length == 0) {
    return <>{rawStr}</>;
  }
  return (
    <>
      <table className="min-w-full">
        <thead>
          <tr>
            {
              header_arr.map((header) => {
                return (
                  <th className="py-2 pl-4 pr-3 text-sm font-semibold text-gray-900 !border-2 bg-gray-200">{marked(header, [], inlineElementParserList)}</th>
                );
              })
            }
          </tr>
        </thead>
        <tbody>
          {
            arr.map((item) => {
              return (
                <tr>
                  {item.map((v) => {
                    return (
                      <td className="px-3 py-2 text-sm text-gray-500">{marked(v, [], inlineElementParserList)}</td>
                    );
                  })}
                </tr>
              );
            })
          }
        </tbody>
      </table>
    </>
  )
};


export default {
  name: "table",
  regexp: TABLE_BLOCK_REG,
  renderer,
};