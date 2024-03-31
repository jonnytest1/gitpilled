import { Octokit } from "@octokit/rest";
import { redirect } from "next/navigation";

interface UserRepos {
  name: string;
  count: number;
}

export async function getUsersTopLanguages(rawUser: string): Promise<{
  username: string;
  languages: UserRepos[];
}> {
  const username = rawUser.toLowerCase();

  // TODO: we need a lot of tokens to cycle through
  const octokit = new Octokit({
    auth: process.env.GITHUB_PAT,
  });

  try {
    const userInfo = await octokit.request("GET /users/{username}", {
      username,
    });

    const listOfRepos = await octokit.paginate("GET /users/{username}/repos", {
      username: username,
    });

    // create a list of all the langauge data
    const filteredRepos = listOfRepos
      .filter((repo) => repo.language && !repo.fork)
      .map((repo) => repo.language);

    // get the count of each language in the list
    const languageCount = filteredRepos.reduce(
      (acc: Record<string, number>, lang) => {
        if (!lang) return acc;

        if (acc[lang]) {
          acc[lang] += 1;
        } else {
          acc[lang] = 1;
        }
        return acc;
      },
      {},
    );

    // sort the languages by count and have name and count as a property
    const sortedLanguages = Object.entries(languageCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return {
      username: userInfo.data.login,
      languages: sortedLanguages.splice(0, 5),
    };
  } catch (error) {
    console.error(error);
    return redirect("/404?uusername="+rawUser);
  }
}
