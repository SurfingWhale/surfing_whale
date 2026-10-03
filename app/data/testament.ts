// app/data/testament.ts
// Fauzy's own statement of what Surfing Whale is for, in his words, unedited.
// It lives in the repository rather than the writing database because it is
// not a post among posts — it is what the rest of the site stands on, and it
// should not disappear with a table or a draft toggle.

export const TESTAMENT = {
  title: "Testament",
  date: "2026-10-03",
  // The line the home page carries; it has to be one of the paragraphs' own.
  pull: "A thing does not need to be impressive to deserve a place in the archive.",
  paragraphs: [
    "I want freedom, but I am beginning to understand that freedom is not the absence of responsibility. Freedom means that there is no final blueprint telling me who I am supposed to become, and that is both liberating and terrifying. I can choose photography without becoming a photographer. I can learn to code without becoming a programmer. I can build something without turning it into a business. I can care about something deeply without needing to make it my identity. But the absence of a predetermined identity also means that I have to confront the fact that my choices are mine. There is no external authority I can permanently blame for what I choose to do with my life.",
    "Perhaps what I am looking for is not freedom from responsibility, but freedom to take responsibility for something without being trapped by it. I want to be able to choose something because I care about it now, without having to promise that it will define me forever. I want to leave room for contradiction, uncertainty, failure, and change. I want to preserve ambiguity not as a way of avoiding decisions, but as a way of remaining open to becoming someone I cannot yet describe. There is a difference between refusing to choose because I am afraid of being wrong and choosing while accepting that I may eventually change my mind.",
    "This is where SurfingWhale begins to make sense to me. It is not only a portfolio and it is not only an archive. It is a place where I can leave traces of the things I chose to care about. A photograph does not need to prove that I am a great photographer. A prototype does not need to prove that I am a programmer. A failed experiment does not need to become a lesson with a marketable conclusion. A thought does not need to become a philosophy. A thing does not need to be impressive to deserve a place in the archive. Sometimes it is enough that I chose to make it, experience it, notice it, or care about it.",
    "I still want recognition. I still want people to see what I make. I still want clout, opportunities, validation, and the feeling that my work reached someone. I do not want to pretend otherwise. But I do not want attention to become the authority that decides whether something mattered. I want meaning to exist before the audience arrives. I want to make something, reflect on it, preserve it, and then allow the world to respond. If people care, that is meaningful. If nobody cares, the experience should not become retroactively meaningless.",
    "Perhaps this is the responsibility that comes with freedom. I cannot guarantee that my choices will become impressive, successful, beautiful, or even correct. I can only acknowledge that they were mine. I can choose to care about something without knowing where it will lead. I can make something without knowing whether it will matter to anyone else. I can change my mind without erasing the person who made the earlier choice. I can remain ambiguous without remaining passive. I can be unfinished without considering myself a failure. Maybe the purpose of the archive is not to prove that I became someone important, but to remember that I was here, that I chose, that I cared, and that for a while I was willing to make something out of being alive.",
  ],
} as const;

export const testamentWords = TESTAMENT.paragraphs.join(" ").split(/\s+/).length;
