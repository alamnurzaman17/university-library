import BookList from "@/components/BookList";
import { sampleBooks } from "@/constants";
import React from "react";

const Page = () => {
  return (
    <>
      <BookList title="Borrowed Books" books={sampleBooks}></BookList>
    </>
  );
};

export default Page;
