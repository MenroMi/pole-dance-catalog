-- CreateTable
CREATE TABLE "_RelatedMoves" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_RelatedMoves_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_RelatedMoves_B_index" ON "_RelatedMoves"("B");

-- AddForeignKey
ALTER TABLE "_RelatedMoves" ADD CONSTRAINT "_RelatedMoves_A_fkey" FOREIGN KEY ("A") REFERENCES "Move"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RelatedMoves" ADD CONSTRAINT "_RelatedMoves_B_fkey" FOREIGN KEY ("B") REFERENCES "Move"("id") ON DELETE CASCADE ON UPDATE CASCADE;
