
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Plus, Edit, Trash2 } from 'lucide-react';
import { useLearningData } from '@/hooks/useLearningDataAdmin';
import { CategoryModal } from '@/components/CategoryModal';
import { ChapterModal } from '@/components/ChapterModal';
import { Category, Chapter } from '@/types/learning';
import API from '@/components/AxiosInstance';

const Admin = () => {
  const navigate = useNavigate();
  const { categories, addCategory, updateCategory, deleteCategory, addChapter, updateChapter, deleteChapter } = useLearningData();
  
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [chapterModalOpen, setChapterModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingChapter, setEditingChapter] = useState<{ chapter: Chapter; categoryId: string } | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryModalOpen(true);
  };

  const handleEditChapter = (chapter: Chapter, categoryId: string) => {
    setEditingChapter({ chapter, categoryId });
    setChapterModalOpen(true);
  };

  const handleAddChapter = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setEditingChapter(null);
    setChapterModalOpen(true);
  };

  const handleCategoryModalClose = () => {
    setCategoryModalOpen(false);
    setEditingCategory(null);
  };

  const handleChapterModalClose = () => {
    setChapterModalOpen(false);
    setEditingChapter(null);
    setSelectedCategoryId('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/home')}
                className="hover:bg-blue-50"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                홈으로
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-800">관리자 페이지</h1>
                <p className="text-sm text-gray-600">카테고리와 챕터를 관리하세요</p>
              </div>
            </div>
            <Button onClick={() => setCategoryModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              카테고리 추가
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {categories.map((category) => (
            <Card key={category.id} className="overflow-hidden">
              <CardHeader className="bg-blue-50">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-3">
                    <span className="text-2xl">{category.icon}</span>
                    <div>
                      <h3 className="text-lg font-semibold">{category.title}</h3>
                      <p className="text-sm text-gray-600">{category.description}</p>
                    </div>
                  </CardTitle>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddChapter(category.id)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      챕터 추가
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditCategory(category)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        deleteCategory(category.id);
                        
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {category.chapters.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>챕터명</TableHead>
                        <TableHead>타입</TableHead>
                        <TableHead>수어 개수</TableHead>
                        <TableHead className="w-32">관리</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {category.chapters.map((chapter) => (
                        <TableRow key={chapter.id}>
                          <TableCell className="font-medium">{chapter.title}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              chapter.type === 'word' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {chapter.type === 'word' ? '단어' : '문장'}
                            </span>
                          </TableCell>
                          <TableCell>{chapter.signs.length}개</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditChapter(chapter, category.id)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => deleteChapter(category.id, chapter.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    <p>아직 챕터가 없습니다.</p>
                    <p className="text-sm">위의 "챕터 추가" 버튼을 클릭해서 첫 번째 챕터를 만들어보세요.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      <CategoryModal
        open={categoryModalOpen}
        onClose={handleCategoryModalClose}
        category={editingCategory}
        onSave={async (categoryData) => {
          if (editingCategory) {
            updateCategory(editingCategory.id, categoryData);
            API.put(`${editingCategory.id}`,categoryData)
          } else {
            const res = await API.post("/category", categoryData);
            const createdCategory = res.data as { id: string }; 
            addCategory(categoryData,createdCategory.id);
            // API.post("/learning/category",categoryData);
          }
          handleCategoryModalClose();
        }}
      />

      <ChapterModal
        open={chapterModalOpen}
        onClose={handleChapterModalClose}
        chapter={editingChapter?.chapter}
        categoryId={editingChapter?.categoryId || selectedCategoryId}
        onSave={async (chapterData) => {
          if (editingChapter) {
            updateChapter(editingChapter.categoryId, editingChapter.chapter.id, chapterData);
            const lessonIds = chapterData.signs.map(sign => sign.id);
            await API.post(`/chapters/${editingChapter.chapter.id}/lessons/connect`,{"lesson": lessonIds});
          } else {
            const chapterRes = await API.post<Chapter>("/chapters", {
                categoryid: selectedCategoryId,
                title: chapterData["title"],
                type: chapterData["type"]
              });
            const chapterId = (chapterRes.data as any).id;// ✅ ObjectId 문자열
            addChapter(selectedCategoryId, chapterData,chapterId);
            const lessonIds = chapterData.signs.map(sign => sign.id);
            await API.post(`/chapters/${chapterId}/lessons/connect`,{"lesson": lessonIds});
          }
          handleChapterModalClose();
        }}
      />
    </div>
  );
};

export default Admin;