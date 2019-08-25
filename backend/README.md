# Backend

This .Net Core (2.2) WebApi project is a redone of the original backend develop with Visual Studio Code in C#, providing functions highly similar to the original one. The original backend of this assignment was provided by the tutors, which was written in Python with Flask. 

Code borrowed and modified from https://github.com/cornflourblue/aspnet-core-jwt-authentication-api (MIT licence) to implement token based authentication. 

```bash
dotnet ef migrations add init

dotnet ef database update

dotnet run
```